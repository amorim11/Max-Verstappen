import { useEffect, useRef } from 'react'
import { GlobeIcon } from './icons'
import { ChequerDissolve } from './SectionFx'
import { useHeadingReveal } from '../hooks/useRevealText'
import { STANDINGS, NEXT_RACE } from '../data/season'
import { CIRCUITS } from '../data/circuits'
import { onceInView, prefersReducedMotion, showUnits, splitText } from '../lib/splitText'

// The lap is laid out on a fixed artboard that covers the stage.
const ARTBOARD = { width: 1440, height: 800 }
const LAP_BOX = { x: 300, y: 150, width: 800 }
// Tallest the drawn lap may get (artboard units, measured on the points
// themselves) before it runs off the bottom of the stage. Wide circuits like
// Baku/Madring never reach it; taller ones (Sepang, Monaco...) shrink to fit.
const LAP_MAX_HEIGHT = 560
const DRAW_MS = 6000
const FADE_MS = 800
const REPLAY_DELAY_MS = 4000
const GLOW = 15
const LINE = 5.9
const TAIL = 70
// Artboard units over which a sector marker flares after the lap passes it.
const SPARK_SPAN = 90

function layoutLap() {
  const track = CIRCUITS[NEXT_RACE.circuitKey] ?? CIRCUITS.baku
  const ys = track.points.map(([, y]) => y)
  const minY = Math.min(...ys)
  const extent = Math.max(...ys) - minY
  const s = Math.min(LAP_BOX.width / track.width, LAP_MAX_HEIGHT / extent)
  const box = { x: LAP_BOX.x + (LAP_BOX.width - track.width * s) / 2, y: LAP_BOX.y, width: track.width * s, height: track.height * s }
  // A shrunk lap starts a little lower so it sits centred in the same band.
  if (s < LAP_BOX.width / track.width) box.y += (LAP_BOX.width * 0.75 - LAP_MAX_HEIGHT) / 2 - minY * s
  const pts = track.points.map(([x, y]) => [box.x + x * s, box.y + y * s])
  pts.push(pts[0])
  const dist = [0]
  for (let i = 1; i < pts.length; i += 1) dist.push(dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = dist[dist.length - 1]
  const sectors = [0.25, 0.5, 0.75, 0.999].map((f) => {
    const d = f * total
    const i = dist.findIndex((v) => v >= d)
    return { x: pts[i][0], y: pts[i][1], d }
  })
  return { pts, dist, total, sectors, box }
}

function rgbOf(cssColor) {
  const probe = document.createElement('span')
  probe.style.cssText = `position:absolute;visibility:hidden;color:${cssColor}`
  document.body.appendChild(probe)
  const rgb = getComputedStyle(probe).color.match(/[\d.]+/g).slice(0, 3).map(Number)
  probe.remove()
  return rgb
}
const rgba = ([r, g, b], a) => `rgb(${r} ${g} ${b} / ${a})`
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

function startTrace(canvas, stage) {
  const ctx = canvas.getContext('2d')
  const lap = layoutLap()
  const accent = rgbOf('var(--accent)')
  const white = [255, 255, 255]
  const bright = mix(accent, white, 0.55)
  let progress = 0
  let headAlpha = 1
  let startedAt = null
  let finishedAt = null
  let frame = 0
  let done = false
  let replayTimer = 0

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = stage.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
  }

  const pointsTo = (d) => {
    const out = []
    for (let i = 0; i < lap.pts.length; i += 1) {
      if (lap.dist[i] <= d) {
        out.push(lap.pts[i])
        continue
      }
      const a = lap.pts[i - 1]
      const b = lap.pts[i]
      const t = (d - lap.dist[i - 1]) / (lap.dist[i] - lap.dist[i - 1])
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      break
    }
    return out
  }

  const draw = () => {
    const w = canvas.width
    const h = canvas.height
    if (!w || !h) return
    // Landscape covers the artboard; portrait frames the lap itself, which
    // would otherwise sit mostly off-screen.
    const portrait = w < h
    const { box } = lap
    const scale = portrait
      ? Math.min((w * 0.88) / box.width, (h * 0.8) / box.height)
      : Math.max(w / ARTBOARD.width, h / ARTBOARD.height)
    const ox = portrait
      ? (w - box.width * scale) / 2 - box.x * scale
      : (w - ARTBOARD.width * scale) / 2
    const oy = portrait
      ? (h - box.height * scale) / 2 - box.y * scale
      : (h - ARTBOARD.height * scale) / 2
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.setTransform(1, 0, 0, 1, ox, oy)

    const eased = -(Math.cos(Math.PI * progress) - 1) / 2
    const reach = eased * lap.total
    const pts = pointsTo(reach)
    if (pts.length > 1) {
      const stroke = (from = 0) => {
        ctx.beginPath()
        ctx.moveTo(pts[from][0] * scale, pts[from][1] * scale)
        for (let i = from + 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0] * scale, pts[i][1] * scale)
        ctx.stroke()
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = rgba(accent, 0.06)
      ctx.lineWidth = GLOW * scale
      stroke()
      ctx.strokeStyle = rgba(accent, 0.12)
      ctx.lineWidth = GLOW * 0.45 * scale
      stroke()
      ctx.restore()

      const tailFrom = Math.max(0, pts.length - TAIL)
      const end = pts[pts.length - 1]
      const tail = ctx.createLinearGradient(pts[tailFrom][0] * scale, pts[tailFrom][1] * scale, end[0] * scale, end[1] * scale)
      tail.addColorStop(0, rgba(accent, 0))
      tail.addColorStop(0.45, rgba(accent, 0.9))
      tail.addColorStop(1, rgba(mix(accent, bright, headAlpha), 1))
      ctx.strokeStyle = tail
      ctx.lineWidth = Math.max(2, LINE * scale)
      stroke(tailFrom)

      const tipFrom = Math.max(0, pts.length - Math.round(TAIL * 0.42))
      if (pts.length - tipFrom > 1) {
        const tip = ctx.createLinearGradient(pts[tipFrom][0] * scale, pts[tipFrom][1] * scale, end[0] * scale, end[1] * scale)
        tip.addColorStop(0, rgba(bright, 0))
        tip.addColorStop(1, rgba(white, 0.95 * headAlpha))
        ctx.strokeStyle = tip
        ctx.lineWidth = Math.max(1, LINE * 0.38 * scale)
        stroke(tipFrom)
      }
    }

    for (const sector of lap.sectors) {
      if (reach < sector.d) continue
      const t = Math.min(1, (reach - sector.d) / SPARK_SPAN)
      const r = (12 + (1 - t) * 14) * scale
      const x = sector.x * scale
      const y = sector.y * scale
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r)
      glow.addColorStop(0, rgba(bright, 0.5 + 0.45 * (1 - t)))
      glow.addColorStop(0.45, rgba(accent, 0.32))
      glow.addColorStop(1, rgba(accent, 0))
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  const restart = () => {
    if (done) return
    progress = 0
    headAlpha = 1
    startedAt = null
    finishedAt = null
    frame = requestAnimationFrame(tick)
  }

  const tick = (now) => {
    if (done) return
    if (startedAt === null) startedAt = now
    const elapsed = now - startedAt
    if (elapsed <= DRAW_MS) {
      progress = elapsed / DRAW_MS
      frame = requestAnimationFrame(tick)
    } else {
      progress = 1
      if (finishedAt === null) finishedAt = now
      const fade = now - finishedAt
      headAlpha = Math.max(0, 1 - fade / FADE_MS)
      if (fade >= FADE_MS) {
        replayTimer = window.setTimeout(restart, REPLAY_DELAY_MS)
      } else {
        frame = requestAnimationFrame(tick)
      }
    }
    draw()
  }

  const onResize = () => {
    size()
    draw()
  }
  window.addEventListener('resize', onResize)
  size()

  if (prefersReducedMotion()) {
    progress = 1
    headAlpha = 0
    draw()
    return () => window.removeEventListener('resize', onResize)
  }

  draw()
  const stop = onceInView(stage, () => {
    frame = requestAnimationFrame(tick)
  }, { threshold: 0.35, rootMargin: '0px' })

  return () => {
    stop()
    done = true
    cancelAnimationFrame(frame)
    window.clearTimeout(replayTimer)
    window.removeEventListener('resize', onResize)
  }
}

export default function Season() {
  const headingRef = useHeadingReveal()
  const ruleRef = useRef(null)
  const introRef = useRef(null)
  const plateRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => startTrace(canvasRef.current, stageRef.current), [])

  useEffect(() => {
    const intro = splitText(introRef.current, { unit: 'word', stagger: 34 })
    const plateLetters = Array.from(plateRef.current.querySelectorAll('[data-letters]')).map((el) =>
      splitText(el, { unit: 'letter', stagger: 22 })
    )
    const timers = []
    const run = () => {
      timers.push(window.setTimeout(() => ruleRef.current?.classList.add('is-in'), 260))
      timers.push(window.setTimeout(() => showUnits(intro), 350))
      timers.push(window.setTimeout(() => plateRef.current?.classList.add('is-in'), 260))
      timers.push(window.setTimeout(() => plateLetters.forEach(showUnits), 430))
    }
    const stop = onceInView(headingRef.current, run)
    return () => {
      stop()
      timers.forEach(window.clearTimeout)
    }
  }, [headingRef])

  return (
    <section className="season" id="temporada" aria-label="A temporada até aqui">
      <ChequerDissolve carryVar="--bg-light" />
      <div className="season__stage" ref={stageRef}>
        <canvas ref={canvasRef} className="season__trace" aria-hidden="true" />
        <p className="season__lap-label">
          <span>r{NEXT_RACE.round}</span> {NEXT_RACE.circuit} · {NEXT_RACE.date}
        </p>
      </div>

      <div className="season__content">
        <div>
          <h2 className="season__heading heading-lines" ref={headingRef}>
            <span data-line>a temporada</span>
            <br />
            <span data-line>até aqui</span>
            <span className="season__heading-dot reveal-dot">.</span>
          </h2>
          <div className="season__rule" ref={ruleRef}></div>
          <p className="season__intro" ref={introRef}>
            Cada corrida é um passo à frente. Veja como a temporada está se desenhando.
          </p>
        </div>

        <div className="plate" ref={plateRef}>
          <svg className="plate__frame" viewBox="0 0 277 78" preserveAspectRatio="none" aria-hidden="true">
            <path className="plate__frame-bg" d="M0.5 0.5H276.5V69L268 77.5H0.5Z" />
            <line className="plate__frame-divider" x1="83" y1="0" x2="83" y2="78" />
          </svg>
          <div className="plate__badge">
            <GlobeIcon />
            <div className="plate__f1"><span data-letters>F1</span><span className="plate__year"> / 2026</span></div>
          </div>
          <dl className="plate__stats">
            {STANDINGS.map((item) => (
              <div className="plate__stat-row" key={item.label}>
                <dt className="plate__stat-dt" data-letters>{item.value}</dt>
                <dd className="plate__stat-dd">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
