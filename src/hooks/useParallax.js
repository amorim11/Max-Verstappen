import { useEffect, useRef } from 'react'

/**
 * Pointer-driven depth parallax. Writes transforms straight to the DOM inside a
 * rAF loop so React never re-renders while the cursor moves.
 */
export function useParallax({ shift = 14, lift = 10, tilt = 0, ease = 0.06 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let frame = 0

    const onMove = (event) => {
      targetX = (event.clientX / window.innerWidth) * 2 - 1
      targetY = (event.clientY / window.innerHeight) * 2 - 1
    }

    const tick = () => {
      currentX += (targetX - currentX) * ease
      currentY += (targetY - currentY) * ease
      const x = (-currentX * shift).toFixed(2)
      const y = (-currentY * lift).toFixed(2)
      const rotation = tilt ? ` rotate(${(currentX * tilt).toFixed(2)}deg)` : ''
      el.style.transform = `translate3d(${x}px, ${y}px, 0)${rotation}`
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      el.style.transform = ''
    }
  }, [shift, lift, tilt, ease])

  return ref
}
