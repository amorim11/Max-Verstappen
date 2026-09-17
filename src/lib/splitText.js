/**
 * Splits an element's text into word or letter spans for staggered reveals.
 * Screen readers get the untouched text from a visually hidden copy.
 * Safe to call twice (React StrictMode runs effects twice in development).
 */
export function splitText(el, { unit = 'word', stagger = 0, delay = 0 } = {}) {
  if (!el) return null
  if (el.dataset.split) return el.querySelector('.reveal-line')

  const text = el.textContent.trim()
  const hidden = document.createElement('span')
  hidden.className = 'visually-hidden'
  hidden.textContent = text

  const line = document.createElement('span')
  line.className = unit === 'letter' ? 'reveal-line is-letters' : 'reveal-line'
  line.setAttribute('aria-hidden', 'true')

  const parts = unit === 'letter' ? Array.from(text) : text.split(/\s+/).filter(Boolean)
  parts.forEach((part, i) => {
    const span = document.createElement('span')
    span.className = unit === 'letter' ? 'reveal-unit is-letter' : 'reveal-unit'
    span.textContent = part === ' ' ? ' ' : part
    span.style.transitionDelay = `${delay + i * stagger}ms`
    line.appendChild(span)
  })

  el.replaceChildren(hidden, line)
  el.dataset.split = 'true'
  return line
}

export function showUnits(root) {
  root?.querySelectorAll('.reveal-unit').forEach((unit) => unit.classList.add('is-in'))
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Runs `fn` once, the first time `el` scrolls into view. */
export function onceInView(el, fn, { rootMargin = '0% 0% -20% 0%', threshold = 0.1 } = {}) {
  if (!el) return () => {}
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        fn()
      }
    },
    { rootMargin, threshold }
  )
  observer.observe(el)
  return () => observer.disconnect()
}
