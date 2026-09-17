import { useEffect, useRef } from 'react'
import { onceInView, prefersReducedMotion, showUnits, splitText } from '../lib/splitText'

/** Splits the element into words or letters and staggers them in on first view. */
export function useRevealText({ unit = 'word', stagger = 90, delay = 0, rootMargin } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const line = splitText(el, { unit, stagger, delay })
    if (!line) return
    if (prefersReducedMotion()) {
      showUnits(line)
      return
    }
    return onceInView(el, () => showUnits(line), rootMargin ? { rootMargin } : undefined)
  }, [unit, stagger, delay, rootMargin])

  return ref
}

/**
 * Section headings: each `[data-line]` rises in as a block, 130ms apart, and
 * the trailing `.reveal-dot` follows.
 */
export function useHeadingReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const lines = Array.from(el.querySelectorAll('[data-line]')).map((line) => splitText(line, { unit: 'word' }))
    const dot = el.querySelector('.reveal-dot')
    const timers = []
    const run = () => {
      lines.forEach((line, i) => timers.push(window.setTimeout(() => showUnits(line), i * 130)))
      timers.push(window.setTimeout(() => dot?.classList.add('is-in'), lines.length * 130 + 110))
    }
    if (prefersReducedMotion()) {
      lines.forEach(showUnits)
      dot?.classList.add('is-in')
      return
    }
    const stop = onceInView(el, run)
    return () => {
      stop()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return ref
}
