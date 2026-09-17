// Slowly drifting topographic lines: a smooth noise field traced with marching squares.

const FIELD_SCALE = 3.8
const LEVELS = 2.5
const WARP = 0.37
const SPEED = 1.66
const ALPHA = 0.85
const COLUMNS = 96

function field(x, y, t) {
  let v = Math.sin(x + t * 0.6) * 0.5
  v += Math.sin(y * 0.85 - t * 0.45) * 0.45
  v += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35
  v += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25
  return v * 0.5 + 0.5
}

export function startContour(canvas, colorVar) {
  if (!canvas) return () => {}
  const ctx = canvas.getContext('2d')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = performance.now()
  let frame = null
  let visible = true
  let grid = null

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
  }

  const draw = (now) => {
    const w = canvas.width
    const h = canvas.height
    if (!w || !h) return
    const t = reduce ? 0 : ((now - start) / 1000) * SPEED
    const cols = w >= h ? COLUMNS : Math.max(8, Math.round((COLUMNS * w) / h))
    const rows = Math.max(8, Math.round((cols * h) / w))
    const cw = w / cols
    const ch = h / rows
    const aspect = w / h
    if (!grid || grid.length !== (cols + 1) * (rows + 1)) grid = new Float32Array((cols + 1) * (rows + 1))

    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        const x = ((i / cols) * 2 - 1) * aspect * FIELD_SCALE
        const y = ((j / rows) * 2 - 1) * FIELD_SCALE
        const wx = x + Math.sin(y * 0.8 + t * 0.7) * WARP
        const wy = y + Math.cos(x * 0.7 - t * 0.6) * WARP
        grid[j * (cols + 1) + i] = field(wx, wy, t) * LEVELS
      }
    }

    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim()
    ctx.lineWidth = 1
    ctx.globalAlpha = ALPHA
    ctx.beginPath()
    const seg = (a, b) => {
      ctx.moveTo(a[0], a[1])
      ctx.lineTo(b[0], b[1])
    }
    for (let level = 0.5; level < LEVELS; level += 1) {
      for (let j = 0; j < rows; j += 1) {
        for (let i = 0; i < cols; i += 1) {
          const tl = grid[j * (cols + 1) + i]
          const tr = grid[j * (cols + 1) + i + 1]
          const br = grid[(j + 1) * (cols + 1) + i + 1]
          const bl = grid[(j + 1) * (cols + 1) + i]
          const code = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0)
          if (code === 0 || code === 15) continue
          const x0 = i * cw
          const y0 = j * ch
          const top = [x0 + cw * ((level - tl) / (tr - tl)), y0]
          const right = [x0 + cw, y0 + ch * ((level - tr) / (br - tr))]
          const bottom = [x0 + cw * ((level - bl) / (br - bl)), y0 + ch]
          const left = [x0, y0 + ch * ((level - tl) / (bl - tl))]
          switch (code) {
            case 1: case 14: seg(left, bottom); break
            case 2: case 13: seg(bottom, right); break
            case 3: case 12: seg(left, right); break
            case 4: case 11: seg(top, right); break
            case 6: case 9: seg(top, bottom); break
            case 7: case 8: seg(left, top); break
            case 5: seg(left, top); seg(bottom, right); break
            case 10: seg(left, bottom); seg(top, right); break
            default: break
          }
        }
      }
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const loop = (now) => {
    if (!visible) {
      frame = null
      return
    }
    draw(now)
    frame = reduce ? null : requestAnimationFrame(loop)
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible && frame === null) frame = requestAnimationFrame(loop)
    },
    { threshold: 0.01 }
  )
  observer.observe(canvas)
  const onResize = () => {
    size()
    draw(performance.now())
  }
  window.addEventListener('resize', onResize)
  size()
  frame = requestAnimationFrame(loop)

  return () => {
    if (frame !== null) cancelAnimationFrame(frame)
    observer.disconnect()
    window.removeEventListener('resize', onResize)
  }
}
