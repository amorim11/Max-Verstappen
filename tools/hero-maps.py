"""Builds the hero textures from photographs of him and of his helmet.

The hero draws photographs, not models: each is a quad textured with the photo,
displaced and relit per pixel from a depth map so it holds a little volume as
the pointer moves. This script produces the four maps each quad samples.

    python tools/hero-maps.py

Sources: his 2025 Oracle Red Bull Racing press cut-out, which already carries a
clean alpha channel so nothing here has to key hair, and a head-on product shot
of the 2024 Schuberth, keyed off its white background.
"""
import numpy as np
from PIL import Image, ImageFilter

OUT = 'src/hero/maps'

# Each subject: its source, the square window on it that becomes a hero quad,
# how far in from the silhouette the depth dome tops out, and how much relief to
# take from the photo itself. The helmet is a smooth glossy shell, so lifting
# detail out of its luminance would only emboss the sponsor decals.
SUBJECTS = {
    'person': {
        'src': 'src/assets/images/portrait-2025-cutout.webp',
        # Framed so the head sits a little above centre with room for a helmet,
        # and the bust runs off the bottom edge.
        'crop': (190, -75, 1190, 925),
        'reach': 0.19,
        'detail': 0.9,
        'sizes': {'diffuse': 1440, 'alpha': 1440, 'depth': 720, 'normal': 1024},
    },
    'helmet': {
        'src': 'src/assets/images/helmet-2024-front.webp',
        'crop': (144, 12, 926, 794),
        'reach': 0.2,
        'detail': 0.0,
        # Worn, the bottom of the chin bar disappears behind the collar. Fading
        # the alpha out over the aero lip is what seats it on him.
        'fade': (0.87, 0.97),
        # Keyed off a white background, so its alpha comes out hard-edged and
        # its rim pixels still carry that white.
        'feather': 1.3,
        'unmatte': 1.0,
        'sizes': {'diffuse': 1024, 'alpha': 1024, 'depth': 512, 'normal': 768},
    },
}

# Landmarks inside the person's window, in 0..1 of its side, measured from the
# alpha and a skin mask. HeroScene sizes and places the helmet from these.
LAYOUT = {
    'headCenterX': 0.430,
    'headTop': 0.130,
    'headBottom': 0.635,
    'headWidth': 0.375,
}


def _box(a, r, axis):
    """One box pass along an axis, edge-clamped, via a running sum."""
    if r < 1:
        return a
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
    n = a.shape[axis]
    lo = np.take(c, np.arange(n), axis)
    hi = np.take(c, np.arange(2 * r + 1, n + 2 * r + 1), axis)
    return (hi - lo) / (2 * r + 1)


def blur(a, sigma):
    """Three box passes: close enough to a gaussian, and works on floats."""
    if sigma <= 0:
        return a
    r = max(1, int(round(sigma * 0.9)))
    out = a.astype(np.float32)
    for _ in range(3):
        out = _box(_box(out, r, 0), r, 1)
    return out


def _edt1d(f):
    """Felzenszwalb's 1-D squared distance transform of a sampled function."""
    n = len(f)
    d = np.empty(n, np.float64)
    v = np.zeros(n, np.int32)
    z = np.empty(n + 1, np.float64)
    k = 0
    z[0], z[1] = -np.inf, np.inf
    for q in range(1, n):
        s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
        while s <= z[k]:
            k -= 1
            s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
        k += 1
        v[k] = q
        z[k] = s
        z[k + 1] = np.inf
    k = 0
    for q in range(n):
        while z[k + 1] < q:
            k += 1
        d[q] = (q - v[k]) ** 2 + f[v[k]]
    return d


def distance_inside(mask):
    """Distance from every pixel to the nearest one outside the mask."""
    f = np.where(mask, 1e12, 0.0)
    for y in range(f.shape[0]):
        f[y] = _edt1d(f[y])
    f = np.ascontiguousarray(f.T)
    for y in range(f.shape[0]):
        f[y] = _edt1d(f[y])
    return np.sqrt(f.T)


def bleed(rgb, mask, rounds=22):
    """Grows the colour past the silhouette so the parallax never samples air."""
    out = rgb.copy()
    have = mask.copy()
    neighbours = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))
    for _ in range(rounds):
        if have.all():
            break
        w = have.astype(np.float32)
        acc = np.zeros_like(out)
        wt = np.zeros_like(w)
        for dy, dx in neighbours:
            k = 1.0 if dy == 0 or dx == 0 else 0.7071
            acc += np.roll(np.roll(out * w[..., None], dy, 0), dx, 1) * k
            wt += np.roll(np.roll(w, dy, 0), dx, 1) * k
        grew = (~have) & (wt > 0)
        out[grew] = acc[grew] / wt[grew, None]
        have |= grew
    return out


def crop(im, window):
    """The window, padded with transparency where it runs off the source."""
    x0, y0, x1, y1 = window
    out = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
    sx0, sy0 = max(0, x0), max(0, y0)
    sx1, sy1 = min(im.width, x1), min(im.height, y1)
    out.paste(im.crop((sx0, sy0, sx1, sy1)), (sx0 - x0, sy0 - y0))
    return out


def save(arr, name, size, mode, sharpen=False):
    a = np.clip(arr * 255.0 + 0.5, 0, 255).astype(np.uint8)
    img = Image.fromarray(a, mode)
    if img.width != size:
        img = img.resize((size, size), Image.LANCZOS)
    if sharpen:
        img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=52, threshold=3))
    img.save(f'{OUT}/{name}.webp', 'WEBP', quality=93, method=6)
    print(f'{name:8} {img.size} {img.mode}')


def build(name, spec):
    src = np.asarray(crop(Image.open(spec['src']).convert('RGBA'), spec['crop']), np.float32) / 255.0
    rgb, alpha = src[..., :3], src[..., 3]
    h, w = alpha.shape

    if spec.get('feather'):
        alpha = np.clip((blur(alpha, spec['feather']) - 0.34) / 0.32, 0, 1)
    if spec.get('unmatte') is not None:
        # Undo the background the edge pixels were composited over, or the
        # silhouette keeps a halo of it wherever the coverage is partial.
        cover = np.clip(alpha, 0.04, 1)[..., None]
        rgb = np.clip((rgb - (1 - cover) * spec['unmatte']) / cover, 0, 1)

    mask = alpha > 0.5

    # Rounded relief straight off the silhouette: a body-shaped dome that gives
    # the quad its overall volume. Solved at half size, it is low frequency.
    half = distance_inside(mask[::2, ::2]) * 2.0
    dist = np.asarray(Image.fromarray(half.astype(np.float32), 'F').resize((w, h), Image.BILINEAR), np.float32)
    reach = spec['reach'] * w
    # Blurred, or the ridge where the distance field folds shows up as spokes.
    dome = blur(np.sqrt(np.clip(dist, 0, reach) / reach), 0.007 * w)

    # Two depths. The saved one is the dome alone: it is what shifts the pixels
    # as the pointer moves, and any fine relief in it warps his nose and mouth
    # into someone else. The detailed one never leaves this function — it only
    # feeds the normals, where relief lights the face instead of bending it.
    detailed = dome
    if spec['detail'] > 0:
        # Micro relief from the photograph, kept to lit skin so the sponsor
        # patches on the suit do not read as bumps.
        lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
        detail = (lum - blur(lum, 0.026 * w)) + 0.6 * (lum - blur(lum, 0.007 * w))
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        cx = LAYOUT['headCenterX'] * w
        cy = (LAYOUT['headTop'] + LAYOUT['headBottom']) / 2 * h
        face = np.exp(-(((xx - cx) / (0.62 * LAYOUT['headWidth'] * w)) ** 2
                        + ((yy - cy) / (0.72 * (LAYOUT['headBottom'] - LAYOUT['headTop']) * h)) ** 2))
        skin = np.clip((rgb[..., 0] - rgb[..., 2] - 0.04) * 6.0, 0, 1) * np.clip(lum * 3.0 - 0.3, 0, 1)
        detailed = detailed + blur(detail * face * skin, 0.0015 * w) * spec['detail']
    # Extra blur on the smooth one: the parallax should read as the whole head
    # leaning, never as a feature sliding across the face.
    depth = blur(np.clip(dome, 0, 1), 0.004 * w) * mask
    detailed = blur(np.clip(detailed, 0, 1), 0.0012 * w) * mask

    if spec.get('fade'):
        start, end = spec['fade']
        rows = np.arange(h, dtype=np.float32)[:, None]
        alpha = alpha * np.clip((end * h - rows) / ((end - start) * h), 0, 1)

    smooth = blur(detailed, 0.001 * w)
    gx = np.roll(smooth, -1, 1) - np.roll(smooth, 1, 1)
    gy = np.roll(smooth, -1, 0) - np.roll(smooth, 1, 0)
    strength = 0.036 * w
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(smooth)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    normal = np.stack([nx / length, ny / length, nz / length], -1) * 0.5 + 0.5

    sizes = spec['sizes']
    save(bleed(rgb, mask), f'{name}-diffuse', sizes['diffuse'], 'RGB', sharpen=True)
    save(np.clip(alpha, 0, 1), f'{name}-alpha', sizes['alpha'], 'L')
    save(depth, f'{name}-depth', sizes['depth'], 'L')
    save(normal, f'{name}-normal', sizes['normal'], 'RGB')


def main():
    for name, spec in SUBJECTS.items():
        build(name, spec)


if __name__ == '__main__':
    main()
