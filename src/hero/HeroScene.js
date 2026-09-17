import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import personDiffuse from './maps/person-diffuse.webp'
import personAlpha from './maps/person-alpha.webp'
import personDepth from './maps/person-depth.webp'
import personNormal from './maps/person-normal.webp'
import helmetDiffuse from './maps/helmet-diffuse.webp'
import helmetAlpha from './maps/helmet-alpha.webp'
import helmetDepth from './maps/helmet-depth.webp'
import helmetNormal from './maps/helmet-normal.webp'

// Both the figure and the helmet are photographs, each on its own quad. A depth
// map shifts their pixels and relights them as the pointer moves, so they hold
// a little volume without ever stopping being photographs — a modelled helmet
// never stopped looking modelled. The helmet quad sits over his head and
// materialises where the pointer is.

const DEG = Math.PI / 180

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const FOV = 35
const QUAD = 4.1
const CAMERA_Z = QUAD / 2 / Math.tan((FOV / 2) * DEG)

// Where the head sits inside the quad, in 0..1 from its top-left corner.
// Measured from the alpha and a skin mask by tools/hero-maps.py; if the crop
// there changes, these change with it.
const HEAD = { x: 0.43, top: 0.13, bottom: 0.635, width: 0.375 }
const HEAD_HEIGHT = HEAD.bottom - HEAD.top

// And where the helmet sits inside its own square, from tools/hero-maps.py.
// `bottom` is where the chin bar ends; the aero lip hangs below it.
const HELMET = { top: 0.046, bottom: 0.886 }

const PARAMS = {
  // Photo
  // Both kept low on purpose. The point is that he looks alive under the
  // pointer, not that he reshapes: past about this the parallax starts widening
  // his face and the relight starts re-sculpting it.
  parallax: 0.002, // uv shift between the near and far pixels
  relight: 0.26,
  // Helmet, placed off HEAD: crown this far above his hair, chin bar this far
  // below his chin, both as a share of the head's height.
  helmetLift: 0.05,
  helmetDrop: 0.11,
  helmetParallax: 0.007,
  helmetRelight: 0.3,
  helmetDrift: 0.014, // how far it slides ahead of the face
  // Reveal, in NDC units of half the canvas height
  revealRadius: 0.6,
  revealEdge: 0.22,
  // Past this far from the helmet the disc would only clip a corner off it, and
  // a stray sliver of visor floating on his temple reads as a glitch. So the
  // whole helmet fades out instead.
  revealNear: 0.8,
  revealFar: 1.2,
  // Entrance
  riseDistance: 190, // px the figure lifts through
  riseDuration: 2000,
  introDuration: 2200,
  introHold: 0.16, // the helmet stays solid this far into the intro
  pointerLerp: 110, // ms
}

const photoVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec4 vClip;
  void main() {
    vUv = uv;
    vClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vClip;
  }
`

// Shared by the figure and the helmet. `uMasked` turns on the disc that follows
// the pointer, which only the helmet wants.
const photoFragment = /* glsl */ `
  uniform sampler2D uDiffuse;
  uniform sampler2D uDepth;
  uniform sampler2D uAlpha;
  uniform sampler2D uNormal;
  uniform vec2 uParallax;
  uniform float uDepthScale;
  uniform float uRelight;
  uniform float uFade;
  uniform float uMasked;
  uniform vec2 uPointerNdc;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uEdge;
  uniform float uIntro;
  uniform float uHold;
  uniform float uGate;
  varying vec2 vUv;
  varying vec4 vClip;

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    vec2 uv = vUv + uParallax * (depth - 0.5) * uDepthScale;

    vec4 colour = texture2D(uDiffuse, uv);
    float alpha = texture2D(uAlpha, uv).r;

    // A key light that swings with the pointer, off the photo's own relief.
    vec3 normal = normalize(texture2D(uNormal, uv).rgb * 2.0 - 1.0);
    vec3 light = normalize(vec3(uParallax * 1.6, 1.0));
    float lambert = max(dot(normal, light), 0.0) - 0.72;
    vec3 lit = colour.rgb * (1.0 + lambert * uRelight);

    float mask = 1.0;
    if (uMasked > 0.5) {
      vec2 ndc = vClip.xy / vClip.w;
      float dist = length(vec2(ndc.x * uAspect, ndc.y) - vec2(uPointerNdc.x * uAspect, uPointerNdc.y));
      float pointer = (1.0 - smoothstep(uRadius, uRadius + uEdge, dist)) * uGate;
      // On load he is wearing it, and it burns off to leave the face.
      float intro = 1.0 - smoothstep(uHold, 1.0, uIntro);
      mask = max(pointer, intro);
    }

    gl_FragColor = vec4(clamp(lit, 0.0, 1.0), alpha * mask * uFade);
    #include <colorspace_fragment>
  }
`

export class HeroScene {
  /**
   * @param {HTMLElement} holder element the scene fills with its own canvas
   * @param {{ onReady?: () => void }} options
   */
  constructor(holder, { onReady } = {}) {
    // The canvas belongs to the scene: a canvas whose context was disposed
    // cannot be handed to a second renderer.
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    holder.appendChild(canvas)
    this.holder = holder
    this.canvas = canvas
    this.onReady = onReady
    this.params = { ...PARAMS }
    this.disposed = false
    this.ready = false

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.02
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
    this.camera.position.set(0, 0, CAMERA_Z)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    this.scene.environment = this.envTexture

    const key = new THREE.DirectionalLight('#fff4e8', 2.1)
    key.position.set(-3.5, 4.5, 6)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight('#dfe8ff', 1.2)
    rim.position.set(4.5, 2, -3)
    this.scene.add(rim)

    this.subject = new THREE.Group()
    this.scene.add(this.subject)

    this.revealUniforms = {
      uPointerNdc: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1 },
      uRadius: { value: 0 },
      uEdge: { value: PARAMS.revealEdge },
      uIntro: { value: 0 },
      uHold: { value: PARAMS.introHold },
      uGate: { value: 0 },
      uFade: { value: 0 },
    }

    // Pointer state. `at` is in NDC, `inside` says whether it is over the hero.
    this.pointer = { x: 0, y: 0, inside: false }
    this.smooth = { x: 0, y: 0, radius: 0 }

    this.intro = 0
    this.introStart = null
    this.introRequested = false
    this.lastTime = null
    this.frame = 0
    this.active = true

    this.load()
  }

  async load() {
    const loader = new THREE.TextureLoader()
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()
    const load = (url, srgb = false) =>
      new Promise((resolve, reject) => {
        loader.load(
          url,
          (texture) => {
            if (srgb) texture.colorSpace = THREE.SRGBColorSpace
            texture.anisotropy = Math.min(8, maxAnisotropy)
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            resolve(texture)
          },
          undefined,
          reject
        )
      })

    const maps = await Promise.all(
      [personDiffuse, personAlpha, personDepth, personNormal,
       helmetDiffuse, helmetAlpha, helmetDepth, helmetNormal].map((url, i) => load(url, i % 4 === 0))
    )
    if (this.disposed) {
      for (const texture of maps) texture.dispose()
      return
    }
    this.textures = maps

    this.buildPhoto(...maps.slice(0, 4))
    this.buildHelmet(...maps.slice(4))
    this.resize()

    await this.renderer.compileAsync(this.scene, this.camera)
    if (this.disposed) return
    this.ready = true
    if (this.introRequested && this.introStart === null) this.introStart = performance.now()
    this.renderFrame(performance.now())
    this.onReady?.()
    this.frame = requestAnimationFrame(this.tick)
  }

  /** A quad carrying one photograph, with its depth, alpha and normal maps. */
  photoMaterial(diffuse, alpha, depth, normal, { masked = false } = {}) {
    return new THREE.ShaderMaterial({
      vertexShader: photoVertex,
      fragmentShader: photoFragment,
      uniforms: {
        uDiffuse: { value: diffuse },
        uDepth: { value: depth },
        uAlpha: { value: alpha },
        uNormal: { value: normal },
        uParallax: { value: new THREE.Vector2() },
        uDepthScale: { value: 0 },
        uRelight: { value: 0 },
        uFade: { value: 0 },
        uMasked: { value: masked ? 1 : 0 },
        ...this.revealUniforms,
      },
      transparent: true,
      // Two coplanar quads: render order decides which is on top, not depth.
      depthWrite: false,
      depthTest: false,
    })
  }

  buildPhoto(diffuse, alpha, depth, normal) {
    this.faceMaterial = this.photoMaterial(diffuse, alpha, depth, normal)
    this.photo = new THREE.Mesh(new THREE.PlaneGeometry(QUAD, QUAD), this.faceMaterial)
    this.subject.add(this.photo)
  }

  buildHelmet(diffuse, alpha, depth, normal) {
    // Scale the helmet's own square so its chin bar lands just below his chin
    // and its crown just above his hair, then centre it on his head.
    const top = HEAD.top - this.params.helmetLift * HEAD_HEIGHT
    const bottom = HEAD.bottom + this.params.helmetDrop * HEAD_HEIGHT
    const size = ((bottom - top) / (HELMET.bottom - HELMET.top)) * QUAD
    const centre = top - HELMET.top * (size / QUAD) + size / QUAD / 2

    this.helmetMaterial = this.photoMaterial(diffuse, alpha, depth, normal, { masked: true })
    this.helmet = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.helmetMaterial)
    this.helmet.renderOrder = 1
    this.helmet.visible = false
    this.helmetHome = new THREE.Vector2((HEAD.x - 0.5) * QUAD, (0.5 - centre) * QUAD)
    this.helmet.position.set(this.helmetHome.x, this.helmetHome.y, 0)
    this.subject.add(this.helmet)
  }

  /** Starts the entrance, or queues it until the textures are in. */
  beginIntro() {
    this.introRequested = true
    if (this.ready && this.introStart === null) this.introStart = performance.now()
  }

  skipIntro() {
    this.introStart = -Infinity
    this.intro = 1
  }

  setActive(active) {
    this.active = active
  }

  setPointer(clientX, clientY, inside = true) {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = 1 - ((clientY - rect.top) / rect.height) * 2
    this.pointer.inside = inside
  }

  releasePointer() {
    this.pointer.inside = false
  }

  resize() {
    const w = Math.max(1, this.canvas.clientWidth)
    const h = Math.max(1, this.canvas.clientHeight)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.revealUniforms.uAspect.value = w / h
    this.pxPerUnit = h / QUAD
  }

  tick = (now) => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.tick)
    if (!this.active || document.visibilityState !== 'visible') {
      this.lastTime = null
      return
    }
    this.renderFrame(now)
  }

  renderFrame(now) {
    if (!this.ready) return
    const dt = this.lastTime === null ? 16 : Math.min(64, now - this.lastTime)
    this.lastTime = now
    const p = this.params

    if (this.introStart !== null && this.intro < 1) {
      this.intro = Math.min(1, (now - this.introStart) / p.introDuration)
    }
    const started = this.introStart !== null

    const ease = 1 - Math.exp(-dt / p.pointerLerp)
    const s = this.smooth
    s.x += ((this.pointer.inside ? this.pointer.x : 0) - s.x) * ease
    s.y += ((this.pointer.inside ? this.pointer.y : 0) - s.y) * ease
    s.radius += ((this.pointer.inside ? p.revealRadius : 0) - s.radius) * (1 - Math.exp(-dt / 150))

    // Entrance: the figure lifts into place while the helmet burns off.
    const rise = started ? Math.min(1, (now - this.introStart) / p.riseDuration) : 0
    const lifted = 1 - (1 - rise) ** 3
    const fade = started ? Math.min(1, (now - this.introStart) / 420) : 0

    this.subject.position.set(
      s.x * p.helmetDrift * QUAD * 0.4,
      (1 - lifted) * -p.riseDistance / (this.pxPerUnit || 1) + s.y * p.helmetDrift * QUAD * 0.2,
      0
    )

    const face = this.faceMaterial.uniforms
    face.uParallax.value.set(s.x, s.y)
    face.uDepthScale.value = p.parallax
    face.uRelight.value = p.relight

    // The helmet is in front of him, so it takes the pointer a little harder
    // than the face does. That difference is what sells it as sitting proud.
    const helmet = this.helmetMaterial.uniforms
    helmet.uParallax.value.set(s.x, s.y)
    helmet.uDepthScale.value = p.helmetParallax
    helmet.uRelight.value = p.helmetRelight
    this.helmet.position.set(
      this.helmetHome.x + s.x * p.helmetDrift * QUAD,
      this.helmetHome.y + s.y * p.helmetDrift * QUAD * 0.5,
      0
    )

    // Both the pointer and the helmet in the same space the shader measures in:
    // NDC with x scaled by the aspect, which is world units over half the quad.
    const aspect = this.revealUniforms.uAspect.value
    const gateDistance = Math.hypot(
      s.x * aspect - (this.subject.position.x + this.helmet.position.x) * (2 / QUAD),
      s.y - (this.subject.position.y + this.helmet.position.y) * (2 / QUAD)
    )
    const gate = 1 - smoothstep(p.revealNear, p.revealFar, gateDistance)

    const reveal = this.revealUniforms
    reveal.uPointerNdc.value.set(s.x, s.y)
    reveal.uRadius.value = s.radius
    reveal.uEdge.value = p.revealEdge
    reveal.uIntro.value = started ? this.intro : 0
    reveal.uHold.value = p.introHold
    reveal.uGate.value = gate
    reveal.uFade.value = fade
    // Nothing to draw once it has burned off and the pointer is away.
    this.helmet.visible = (s.radius > 0.001 && gate > 0.001) || this.intro < 1

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    const seen = new Set()
    this.scene.traverse((object) => {
      if (object.geometry && !seen.has(object.geometry)) {
        seen.add(object.geometry)
        object.geometry.dispose()
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) {
        if (!material || seen.has(material)) continue
        seen.add(material)
        material.map?.dispose()
        material.dispose()
      }
    })
    for (const texture of this.textures ?? []) texture.dispose()
    this.canvas.remove()
    this.envTexture.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
