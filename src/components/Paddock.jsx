import { useEffect, useRef } from 'react'
import { ChequerDissolve, ContourCanvas } from './SectionFx'
import { StatIcon } from './icons'
import { useHeadingReveal } from '../hooks/useRevealText'
import { creditLabel } from '../photoCredits'
import { CALENDAR } from '../data/calendar'
import { LAST_RACE } from '../data/season'
import { onceInView, prefersReducedMotion, showUnits, splitText } from '../lib/splitText'
import { passProgress, watchScroll } from '../lib/scrollFx'
import paddockImg from '../assets/images/rb22-austria-2026.jpg'

function Calendar() {
  const listRef = useRef(null)

  useEffect(() => {
    const list = listRef.current
    const items = Array.from(list.children)
    const live = list.querySelector('.is-live')
    // Start the strip with the next race in view.
    if (live) list.scrollLeft = live.offsetLeft - list.clientWidth / 2 + live.clientWidth / 2

    if (prefersReducedMotion()) {
      items.forEach((item) => item.classList.add('is-in'))
      return
    }
    const timers = []
    const stop = onceInView(list, () => {
      const first = Math.max(0, items.findIndex((item) => item.offsetLeft + item.clientWidth > list.scrollLeft))
      items.forEach((item, i) => {
        timers.push(window.setTimeout(() => item.classList.add('is-in'), Math.max(0, i - first) * 90))
      })
    })
    return () => {
      stop()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <div className="calendar" id="calendario">
      <h3 className="visually-hidden">Calendário 2026 e resultados de Verstappen</h3>
      <ul className="calendar__list" ref={listRef}>
        {CALENDAR.map((item) => (
          <li key={item.round} className={`calendar__item${item.live ? ' is-live' : ''}${item.result ? ' is-done' : ''}`}>
            <span className="calendar__num">
              {`r${item.round}`}
              {item.live && <span className="calendar__pulse" aria-label="próxima corrida"></span>}
              {item.result && <span className="calendar__result">{item.result}</span>}
            </span>
            <span className="calendar__name">{item.name}</span>
            <span className="calendar__date">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Paddock() {
  const sectionRef = useRef(null)
  const headingRef = useHeadingReveal()
  const ctaRef = useRef(null)
  const photoRef = useRef(null)
  const statsRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const rows = Array.from(statsRef.current.querySelectorAll('.paddock__stat-row'))
    const values = rows.map((row) => splitText(row.querySelector('.paddock__stat-value'), { unit: 'letter', stagger: 24 }))
    const timers = []

    const stopCta = onceInView(section, () => timers.push(window.setTimeout(() => ctaRef.current?.classList.add('is-in'), 520)))
    const stopStats = onceInView(statsRef.current, () =>
      values.forEach((line, i) => timers.push(window.setTimeout(() => showUnits(line), i * 90)))
    )
    const stopParallax = prefersReducedMotion()
      ? () => {}
      : watchScroll(section, () => {
          if (photoRef.current) photoRef.current.style.transform = `translateY(${(1 - passProgress(section)) * 48}px)`
        })

    return () => {
      stopCta()
      stopStats()
      stopParallax()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <section className="paddock" id="paddock" aria-label="Do paddock" ref={sectionRef}>
      <ContourCanvas className="paddock__contour" colorVar="--contour-paddock" />
      <ChequerDissolve carryVar="--ink" />
      <div className="paddock__band" aria-hidden="true"></div>

      <figure className="paddock__photo" ref={photoRef}>
        <img src={paddockImg} alt="Red Bull RB22 número 3 de Max Verstappen no GP da Áustria de 2026" loading="lazy" />
        <figcaption className="photo-credit photo-credit--plate">{creditLabel('rb22_austria2026')}</figcaption>
      </figure>

      <h2 className="paddock__heading heading-lines" ref={headingRef}>
        <span data-line>do</span>
        <br />
        <span data-line>paddock</span>
        <span className="accent-dot reveal-dot">.</span>
      </h2>

      <div className="paddock__intro">
        <p className="paddock__report">{LAST_RACE.report}</p>
        <a href="#calendario" className="paddock__cta" ref={ctaRef}>
          <svg className="paddock__cta-frame" viewBox="0 0 217 50" preserveAspectRatio="none" aria-hidden="true">
            <path className="paddock__cta-body" d="M0.5 0.5H216.5V42L209 49.5H0.5Z" />
            <path className="paddock__cta-flood" d="M0.5 0.5H216.5V42L209 49.5H0.5Z" />
            <path className="paddock__cta-outline" d="M0.5 0.5H216.5V42L209 49.5H0.5Z" />
          </svg>
          <span>ver calendário</span>
          <svg className="paddock__cta-arrow" viewBox="0 0 13 11" aria-hidden="true"><path d="M0 5.35H13M8 10.35L13 5.35L8 0.35" /></svg>
        </a>
      </div>

      <div className="paddock__panels">
        <div className="paddock__panel">
          <p className="paddock__panel-eyebrow">{LAST_RACE.name}</p>
          <p className="paddock__panel-dd">{LAST_RACE.circuit}</p>
          <p className="paddock__panel-dd">{LAST_RACE.date}</p>
        </div>
        <div className="paddock__panel" ref={statsRef}>
          {LAST_RACE.stats.map((stat) => (
            <div className="paddock__stat-row" key={stat.label}>
              <StatIcon name={stat.icon} />
              <div>
                <p className="paddock__stat-label">{stat.label}</p>
                <p className="paddock__stat-value">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Calendar />
    </section>
  )
}
