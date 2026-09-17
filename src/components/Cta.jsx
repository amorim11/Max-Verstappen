import { ArrowIcon } from './icons'

const FRAME = 'M220 42L212.9 50H0V0H220V42Z'
const CORNERS = 'M205 49.5H213L219.5 42V36M212 0.5H219.5V7M8 0.5H0.5V7M7.5 49.5H0.5V42.5'

export default function Cta({ href, label, className = '' }) {
  return (
    <a href={href} className={`cta ${className}`}>
      <svg className="cta__frame" viewBox="0 0 220 50" preserveAspectRatio="none" aria-hidden="true">
        <path className="cta__base" d={FRAME} />
        <path className="cta__flood" d={FRAME} />
        <path className="cta__outline" d={FRAME} />
        <path className="cta__corners" d={CORNERS} />
      </svg>
      <span className="cta__label">{label}</span>
      <ArrowIcon className="cta__arrow" />
    </a>
  )
}
