import { useEffect, useRef } from 'react'

export function useReveal(activeClass = 'is-visible', threshold = 0.2, rootMargin = '0px') {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add(activeClass)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(activeClass)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeClass, threshold, rootMargin])

  return ref
}
