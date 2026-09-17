import { useEffect, useRef } from 'react'
import { useHeadingReveal } from '../hooks/useRevealText'
import { creditLabel } from '../photoCredits'
import { MILESTONES } from '../data/timeline'
import { onceInView, prefersReducedMotion, showUnits, splitText } from '../lib/splitText'
import { passProgress, watchScroll } from '../lib/scrollFx'

// Rounded plate with a notch cut into the bottom edge, in bounding-box units.
const PLATE_CLIP =
  'M0.01915,0.00107H0.98085C0.98574,0.00107 0.99044,0.003 0.9939,0.00642C0.99736,0.00984 0.9993,0.01449 0.9993,0.01933V0.88815C0.9993,0.89299 0.99736,0.89763 0.9939,0.90105C0.99044,0.90448 0.98574,0.9064 0.98085,0.9064H0.64733C0.63864,0.9064 0.63007,0.90834 0.62224,0.91206C0.61442,0.91579 0.60754,0.92122 0.60212,0.92794L0.56153,0.9783C0.55635,0.98474 0.54976,0.98993 0.54227,0.9935C0.53478,0.99707 0.52656,0.99892 0.51825,0.99892H0.01915C0.01426,0.99892 0.00956,0.997 0.0061,0.99358C0.00264,0.99016 0.0007,0.98551 0.0007,0.98067V0.01933C0.0007,0.01449 0.00264,0.00984 0.0061,0.00642C0.00956,0.003 0.01426,0.00107 0.01915,0.00107Z'
const PLATE_OUTLINE =
  'M13.6 0.5H697.4C700.9 0.5 704.2 1.4 706.7 3C709.1 4.6 710.5 6.7 710.5 8.9V411.2C710.5 413.4 709.1 415.6 706.7 417.2C704.2 418.8 700.9 419.7 697.4 419.7H460.2C454.1 419.7 448 420.6 442.4 422.3C436.8 424 432 426.5 428.1 429.6L399.2 453C395.6 455.9 390.9 458.3 385.6 460C380.2 461.6 374.4 462.5 368.5 462.5H13.6C10.1 462.5 6.8 461.6 4.3 460C1.9 458.4 0.5 456.3 0.5 454V8.9C0.5 6.7 1.9 4.6 4.3 3C6.8 1.4 10.1 0.5 13.6 0.5Z'

function TimelineRow({ milestone, onEnter, onLeave, rowRef }) {
  const yearRef = useRef(null)
  const copyRef = useRef(null)
  const isCentre = milestone.frame === 'centre'

  useEffect(() => {
    const row = rowRef.current
    const year = splitText(yearRef.current, { unit: 'letter', stagger: 26 })
    const timers = []
    const run = () => {
      showUnits(year)
      row.classList.add('is-in')
      timers.push(window.setTimeout(() => copyRef.current?.classList.add('is-in'), 220))
      if (isCentre) timers.push(window.setTimeout(() => yearRef.current?.classList.add('is-settled'), 2200))
    }
    if (prefersReducedMotion()) {
      run()
      return
    }
    const stop = onceInView(row, run, { rootMargin: '0% 0% -25% 0%' })
    return () => {
      stop()
      timers.forEach(window.clearTimeout)
    }
  }, [rowRef, isCentre])

  const plateAlign = isCentre ? 'center' : milestone.align
  const copySide = isCentre ? 'right' : milestone.align === 'right' ? 'left' : 'right'

  return (
    <div ref={rowRef} className={`timeline__row${isCentre ? '' : ' is-side'} copy-${copySide}`}>
      <figure className={`timeline__plate align-${plateAlign}`} onPointerEnter={onEnter} onPointerLeave={onLeave}>
        <svg className="timeline__plate-outline" viewBox="0 0 711 463" preserveAspectRatio="none" aria-hidden="true">
          <path d={PLATE_OUTLINE} />
        </svg>
        <img className="timeline__photo" src={milestone.src} alt={milestone.alt} loading="lazy" />
        <figcaption className="photo-credit photo-credit--plate">{creditLabel(milestone.creditKey)}</figcaption>
      </figure>
      <div className="timeline__year" ref={yearRef}>{milestone.year}</div>
      <p className="timeline__copy" ref={copyRef}>
        <b>{milestone.title}</b> {milestone.copy}
      </p>
    </div>
  )
}

export default function Timeline() {
  const sectionRef = useRef(null)
  const threadRef = useRef(null)
  const rotatorRef = useRef(null)
  const headingRef = useHeadingReveal()
  const rowRefs = useRef(MILESTONES.map(() => ({ current: null }))).current

  // The white thread runs down the rail as the section scrolls past, with a spinning square at its tip.
  useEffect(() => {
    const section = sectionRef.current
    return watchScroll(section, () => {
      const p = passProgress(section)
      if (threadRef.current) threadRef.current.style.height = `${p * 100}%`
      if (rotatorRef.current) {
        rotatorRef.current.style.top = `${p * 100}%`
        rotatorRef.current.style.transform = `translate(-50%, -50%) rotate(${p * 1800}deg)`
      }
    })
  }, [])

  const focusRow = (index) => {
    const section = sectionRef.current
    section.classList.add('is-dim-others')
    rowRefs.forEach((ref, i) => ref.current?.classList.toggle('is-focused', i === index))
  }
  const clearFocus = () => sectionRef.current?.classList.remove('is-dim-others')

  return (
    <section className="timeline" id="trajetoria" aria-label="Do kart à F1" ref={sectionRef}>
      <svg width="0" height="0" className="timeline__defs" aria-hidden="true">
        <defs>
          <clipPath id="timeline-plate-clip" clipPathUnits="objectBoundingBox">
            <path d={PLATE_CLIP} />
          </clipPath>
        </defs>
      </svg>

      <h2 className="timeline__heading heading-lines" ref={headingRef}>
        <span data-line>do kart</span>
        <br />
        <span data-line>à f1</span>
        <span className="timeline__heading-dot reveal-dot">.</span>
      </h2>

      <div className="timeline__wrapper">
        <div className="timeline__rail" aria-hidden="true">
          <div className="timeline__rail-line"></div>
          <div className="timeline__thread" ref={threadRef}></div>
          <div className="timeline__rotator" ref={rotatorRef}></div>
        </div>
        {MILESTONES.map((milestone, index) => (
          <TimelineRow
            key={milestone.year}
            milestone={milestone}
            rowRef={rowRefs[index]}
            onEnter={() => focusRow(index)}
            onLeave={clearFocus}
          />
        ))}
      </div>
    </section>
  )
}
