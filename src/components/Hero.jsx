import { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import Cta from './Cta'
import { ContourCanvas } from './SectionFx'
import { useParallax } from '../hooks/useParallax'
import { useReveal } from '../hooks/useReveal'
import { BracketCorners, FlagIcon, StarIcon, DiamondIcon, CircuitTrace, RevealIcon } from './icons'
import { DRIVER, NEXT_RACE, SEASON_STATS } from '../data/season'
import { CIRCUITS } from '../data/circuits'
import { setHeroScene, signal, when } from '../lib/introBus'
import { prefersReducedMotion, showUnits, splitText } from '../lib/splitText'

export default function Hero() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const nameRef = useRef(null)
  const panelsRef = useRef(null)
  const portraitRef = useParallax({ shift: 16, lift: 11 })
  const circuitRef = useReveal('is-in', 0.4)

  const [stage, setStage] = useState({ nav: false, id: false, meta: -1, panels: false, actions: false })

  // Entrance choreography, started once the loading veil has lifted.
  useEffect(() => {
    const name = splitText(nameRef.current, { unit: 'word', stagger: 110 })
    const stats = Array.from(panelsRef.current.querySelectorAll('.panel__stat-value')).map((el) =>
      splitText(el, { unit: 'letter', stagger: 26 })
    )
    const timers = []
    const at = (ms, fn) => timers.push(window.setTimeout(fn, ms))

    const stop = when('veilCleared', () => {
      at(0, () => setStage((s) => ({ ...s, nav: true })))
      at(180, () => {
        setStage((s) => ({ ...s, id: true }))
        showUnits(name)
      })
      ;[0, 1, 2].forEach((i) => at(440 + i * 130, () => setStage((s) => ({ ...s, meta: i }))))
      at(900, () => {
        setStage((s) => ({ ...s, panels: true }))
        stats.forEach(showUnits)
      })
      at(1500, () => setStage((s) => ({ ...s, actions: true })))
    })
    return () => {
      stop()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  // The figure: his photograph on a depth-mapped quad, with the helmet over it.
  // Three.js is a big dependency, so it is fetched on its own chunk while the
  // loading veil is still up.
  useEffect(() => {
    const holder = canvasRef.current
    const section = sectionRef.current
    let scene = null
    let cancelled = false
    const timers = []
    const cleanups = []

    import('../hero/HeroScene')
      .then(({ HeroScene }) => {
        if (cancelled) return
        scene = new HeroScene(holder, { onReady: () => signal('heroReady') })
        setHeroScene(scene)
        if (prefersReducedMotion()) scene.skipIntro()
        cleanups.push(when('veilCleared', () => timers.push(window.setTimeout(() => scene.beginIntro(), 260))))

        const resize = () => scene.resize()
        const observer = new ResizeObserver(resize)
        observer.observe(holder)
        const layer = section.closest('.stack__layer') ?? section
        const visibility = new IntersectionObserver(([entry]) => scene.setActive(entry.isIntersecting))
        visibility.observe(layer)
        cleanups.push(() => {
          observer.disconnect()
          visibility.disconnect()
        })
        update()
      })
      .catch(() => {
        // No WebGL or the chunk failed: the page stands without the figure.
        signal('heroReady')
      })

    let last = null
    let releaseTimer = 0
    const update = () => {
      if (!scene || !last) return
      const rect = section.getBoundingClientRect()
      const inside = last.x >= rect.left && last.x <= rect.right && last.y >= rect.top && last.y <= rect.bottom
      scene.setPointer(last.x, last.y, inside)
    }
    const onMove = (event) => {
      last = { x: event.clientX, y: event.clientY }
      window.clearTimeout(releaseTimer)
      update()
    }
    const onUp = (event) => {
      if (event.pointerType !== 'mouse') releaseTimer = window.setTimeout(() => scene?.releasePointer(), 900)
    }
    const onLeave = () => scene?.releasePointer()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('scroll', update, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      cancelled = true
      window.clearTimeout(releaseTimer)
      timers.forEach(window.clearTimeout)
      cleanups.forEach((fn) => fn())
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', update)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      if (scene) {
        setHeroScene(null)
        scene.dispose()
      }
    }
  }, [])

  return (
    <section className="hero" id="piloto" aria-labelledby="hero-name" ref={sectionRef}>
      <span id="top"></span>
      <ContourCanvas className="hero__contour" colorVar="--contour-light" />

      <div className="hero__figure">
        <div className="hero__figure-layer" ref={portraitRef}>
          <div ref={canvasRef} className="hero__driver" aria-hidden="true"></div>
        </div>
      </div>
      <div className="hero__veil" aria-hidden="true"></div>

      <div className="hero__content">
        <Nav visible={stage.nav} />

        <div className="hero__middle">
          <div className="hero__identity">
            <p className={`hero__id${stage.id ? ' is-in' : ''}`}>{DRIVER.id}</p>
            <h1 className="hero__name" id="hero-name" ref={nameRef}>
              {DRIVER.firstName} {DRIVER.lastName}
            </h1>
            <ul className="hero__meta">
              {[
                { icon: <FlagIcon />, text: DRIVER.country },
                { icon: <StarIcon />, text: DRIVER.status },
                { icon: <DiamondIcon />, text: DRIVER.team },
              ].map((item, i) => (
                <li className={`hero__meta-item${stage.meta >= i ? ' is-in' : ''}`} key={item.text}>
                  {item.icon}
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`hero__panels${stage.panels ? ' is-in' : ''}`} ref={panelsRef}>
            <div className="panel bracket">
              <BracketCorners />
              <p className="panel__eyebrow">próxima corrida</p>
              <dl className="panel__dl">
                <dt className="panel__dt">{NEXT_RACE.name}</dt>
                <dd className="panel__dd">{NEXT_RACE.circuit}</dd>
                <dd className="panel__dd">
                  <time dateTime={NEXT_RACE.dateTime}>{NEXT_RACE.date}</time>
                </dd>
              </dl>
              <CircuitTrace innerRef={circuitRef} circuit={CIRCUITS[NEXT_RACE.circuitKey] ?? CIRCUITS.baku} />
            </div>

            <div className="panel bracket">
              <BracketCorners />
              <p className="panel__eyebrow">temporada 2026</p>
              <dl className="panel__stats">
                {SEASON_STATS.map((stat) => (
                  <div className="panel__stat-cell" key={stat.label}>
                    <dt className="panel__stat-label">{stat.label}</dt>
                    <dd className="panel__stat-value">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className={`hero__actions${stage.actions ? ' is-in' : ''}`}>
          <div className="hero__hint">
            <RevealIcon />
            <span className="hero__hint-text">
              <span className="hero__hint-title">capacete_{DRIVER.number.padStart(2, '0')}</span>
              <span className="hero__hint-sub hero__hint-sub--pointer">passe o cursor no piloto</span>
              <span className="hero__hint-sub hero__hint-sub--touch">toque no piloto</span>
            </span>
          </div>

          <Cta href="#temporada" label="ver temporada" />
        </div>
      </div>
    </section>
  )
}
