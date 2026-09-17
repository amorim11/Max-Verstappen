import { useEffect, useRef } from 'react'
import { startContour } from '../lib/contourCanvas'
import { createChequer } from '../lib/chequerDissolve'
import { entryProgress, watchScroll } from '../lib/scrollFx'

/** Animated topographic lines behind a section. */
export function ContourCanvas({ className = '', colorVar }) {
  const ref = useRef(null)
  useEffect(() => startContour(ref.current, colorVar), [colorVar])
  return <canvas ref={ref} className={`contour-canvas ${className}`} aria-hidden="true" />
}

/**
 * Squares in the colour of the section being covered, dissolving as this
 * section's top edge travels up the viewport.
 */
export function ChequerDissolve({ carryVar }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const section = canvas?.parentElement
    if (!canvas || !section) return
    const chequer = createChequer(canvas, carryVar)
    const stop = watchScroll(section, () => chequer.setProgress(entryProgress(section)))
    return () => {
      stop()
      chequer.destroy()
    }
  }, [carryVar])
  return <canvas ref={ref} className="chequer-canvas" aria-hidden="true" />
}
