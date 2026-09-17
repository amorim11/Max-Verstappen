import Lenis from 'lenis'
import { prefersReducedMotion } from './splitText'

export function startSmoothScroll() {
  if (prefersReducedMotion()) return () => {}
  const lenis = new Lenis({ smoothWheel: true, anchors: true })
  let frame = requestAnimationFrame(function raf(time) {
    lenis.raf(time)
    frame = requestAnimationFrame(raf)
  })
  return () => {
    cancelAnimationFrame(frame)
    lenis.destroy()
  }
}

/** 0 when the element's top meets the bottom of the viewport, 1 when its bottom leaves the top. */
export function passProgress(el) {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight || 1
  return Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)))
}

/**
 * 0 while the element's top edge is still low on screen, 1 once it has risen
 * near the top. Timed so the dissolve strip is in view while it breaks up.
 */
export function entryProgress(el, from = 0.62, to = 0.08) {
  const vh = window.innerHeight || 1
  const top = el.getBoundingClientRect().top / vh
  return Math.min(1, Math.max(0, (from - top) / (from - to)))
}

/** Calls `fn` on every animation frame that follows a scroll, while `el` is near the viewport. */
export function watchScroll(el, fn) {
  let near = false
  let queued = false
  const observer = new IntersectionObserver(
    ([entry]) => {
      near = entry.isIntersecting
      if (near) fn()
    },
    { rootMargin: '20% 0px 20% 0px' }
  )
  observer.observe(el)
  const run = () => {
    queued = false
    if (near) fn()
  }
  const queue = () => {
    if (!queued) {
      queued = true
      requestAnimationFrame(run)
    }
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  fn()
  return () => {
    observer.disconnect()
    window.removeEventListener('scroll', queue)
    window.removeEventListener('resize', queue)
  }
}

const SHADE = 0.55
const SHRINK = 0.1

/**
 * Pinned layers: as the next layer slides over, the pinned one shrinks a little
 * and darkens, then is hidden once fully covered.
 */
export function stackLayers(layers) {
  const narrow = window.matchMedia('(max-width: 639px)')
  let queued = false
  const update = () => {
    queued = false
    const vh = window.innerHeight || 1
    const shrink = narrow.matches ? 0 : SHRINK
    for (const { inner, shade, next } of layers) {
      if (!inner || !shade || !next) continue
      const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / vh))
      inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : ''
      inner.style.willChange = p > 0 && shrink > 0 ? 'transform' : ''
      inner.style.visibility = p >= 1 ? 'hidden' : 'visible'
      shade.style.opacity = String(SHADE * p)
    }
  }
  const queue = () => {
    if (!queued) {
      queued = true
      requestAnimationFrame(update)
    }
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  update()
  return () => {
    window.removeEventListener('scroll', queue)
    window.removeEventListener('resize', queue)
  }
}
