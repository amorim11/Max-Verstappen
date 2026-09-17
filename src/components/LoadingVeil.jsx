import { useEffect, useState } from 'react'
import { signal, when } from '../lib/introBus'

// Front-on helmet silhouette used as a clip for the fill.
const HELMET_PATH =
  'M36 1C16.8 1 4 15.6 4 35.5c0 7.4 1.2 14.2 3.1 20.3C9.9 64.9 12 74 14.6 80.4 16 83.4 19 85 22.4 85h27.2c3.4 0 6.4-1.6 7.8-4.6C60 74 62.1 64.9 64.9 55.8 66.8 49.7 68 42.9 68 35.5 68 15.6 55.2 1 36 1Z' +
  'M1.5 40.5h3v10h-3zM67.5 40.5h3v10h-3z'

const FALLBACK_MS = 2200

export default function LoadingVeil() {
  const [phase, setPhase] = useState('boot')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timers = []
    let done = false
    // One frame at zero so the slow fill has something to transition from.
    const boot = requestAnimationFrame(() => setPhase((p) => (p === 'boot' ? 'loading' : p)))

    const clear = () => {
      if (done) return
      done = true
      setPhase('ready')
      timers.push(window.setTimeout(() => setPhase('clearing'), reduce ? 0 : 430))
      timers.push(
        window.setTimeout(() => {
          setPhase('hidden')
          signal('veilCleared')
        }, reduce ? 0 : 670)
      )
    }

    const stopWaiting = when('heroReady', clear)
    timers.push(window.setTimeout(clear, FALLBACK_MS))
    return () => {
      cancelAnimationFrame(boot)
      stopWaiting()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <div
      className={`veil is-${phase}`}
      role="status"
      aria-live="polite"
      aria-label={phase === 'hidden' ? undefined : 'Carregando'}
      aria-hidden={phase === 'hidden'}
    >
      <svg className="veil__helmet" viewBox="0 0 72 86" aria-hidden="true">
        <defs>
          <clipPath id="veil-helmet-clip">
            <path d={HELMET_PATH} />
          </clipPath>
        </defs>
        <g clipPath="url(#veil-helmet-clip)">
          <rect className="veil__helmet-shell" width="72" height="86" />
          <rect className="veil__helmet-fill" width="72" height="86" />
          <rect className="veil__helmet-visor" x="10" y="33" width="52" height="13" rx="6" />
        </g>
      </svg>
      <p className="veil__title">max verstappen</p>
      <div className="veil__track"><div className="veil__fill"></div></div>
    </div>
  )
}
