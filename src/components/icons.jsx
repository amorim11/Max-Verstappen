export function BracketCorners() {
  const path = <path d="M0 0.5H10V10.5" stroke="currentColor" fill="none" />
  return (
    <>
      <span className="bracket__corner bracket__corner--tl"><svg viewBox="0 0 10.5 10.5">{path}</svg></span>
      <span className="bracket__corner bracket__corner--tr"><svg viewBox="0 0 10.5 10.5">{path}</svg></span>
      <span className="bracket__corner bracket__corner--bl"><svg viewBox="0 0 10.5 10.5">{path}</svg></span>
      <span className="bracket__corner bracket__corner--br"><svg viewBox="0 0 10.5 10.5">{path}</svg></span>
    </>
  )
}

export function FlagIcon() {
  return (
    <svg className="hero__meta-icon" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
      <rect width="18" height="4" y="0" fill="#AE1C28" />
      <rect width="18" height="4" y="4" fill="#fff" />
      <rect width="18" height="4" y="8" fill="#21468B" />
    </svg>
  )
}

export function StarIcon() {
  return (
    <svg className="hero__meta-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0l2.4 5.6L16 8l-5.6 2.4L8 16l-2.4-5.6L0 8l5.6-2.4z" />
    </svg>
  )
}

export function DiamondIcon() {
  return (
    <svg className="hero__meta-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5z" />
    </svg>
  )
}

export function ArrowIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 14 11" aria-hidden="true">
      <path d="M0 5.35H13M8 10.35L13 5.35L8 0.35" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GlobeIcon() {
  return (
    <svg className="plate__globe" viewBox="0 0 37 23" aria-hidden="true">
      <ellipse cx="18.5" cy="11.5" rx="17.5" ry="10.5" />
      <line x1="0.5" y1="11.5" x2="36.5" y2="11.5" />
      <ellipse className="plate__meridian" cx="18.5" cy="11.5" rx="11.5" ry="10.5" />
    </svg>
  )
}

/** Outline of the next race's circuit, drawn point by point. */
export function CircuitTrace({ innerRef, circuit }) {
  return (
    <svg className="circuit" viewBox={circuit.viewBox} aria-hidden="true" ref={innerRef}>
      <path className="circuit__path" pathLength="1" d={circuit.d} />
    </svg>
  )
}

/** Cursor-in-a-circle hint for the helmet reveal. */
export function RevealIcon() {
  return (
    <svg className="hero__hint-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M12 9.5v12.2l3.2-3 2.3 5 2.1-1-2.3-4.9 4.4-.3z" fill="currentColor" />
    </svg>
  )
}

const STAT_ICONS = {
  flag: (
    <>
      <path d="M6 28V5" />
      <path d="M6 6h17l-3.5 5.5L23 17H6" />
      <path d="M10.5 6v11M15 6v11M19.5 6.5v10" strokeOpacity=".45" />
    </>
  ),
  bars: (
    <>
      <path d="M4 28h24" />
      <rect x="6.5" y="17" width="4.5" height="11" />
      <rect x="13.75" y="11" width="4.5" height="17" />
      <rect x="21" y="5" width="4.5" height="23" />
    </>
  ),
  trophy: (
    <>
      <path d="M10 5h12v7a6 6 0 0 1-12 0z" />
      <path d="M10 7.5H6a4 4 0 0 0 4 5.5M22 7.5h4a4 4 0 0 1-4 5.5" />
      <path d="M16 18v5M11 28h10M12.5 28l1-5h5l1 5" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.5 22a11.5 11.5 0 1 1 23 0" />
      <path d="M16 22l6-7" />
      <circle cx="16" cy="22" r="1.8" />
      <path d="M8 22H6M26 22h-2M16 10.5v2M9.6 13.6l1.4 1.4M22.4 13.6L21 15" strokeOpacity=".45" />
    </>
  ),
}

export function StatIcon({ name }) {
  return (
    <svg className="paddock__stat-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      {STAT_ICONS[name]}
    </svg>
  )
}
