// A strip of squares in the previous section's colour that breaks up into a
// chequered pattern as the new section rises into view.

const SOLID = 0.16
const ACCENT_SHARE = 0.06

function hash(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

export function createChequer(canvas, carryVar) {
  const ctx = canvas.getContext('2d')
  let progress = 0

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
  }

  const draw = () => {
    const w = canvas.width
    const h = canvas.height
    if (!w || !h) return
    const cell = 24 * Math.min(window.devicePixelRatio || 1, 2)
    const cols = Math.ceil(w / cell)
    const rows = Math.ceil(h / cell)
    const styles = getComputedStyle(document.documentElement)
    const carry = styles.getPropertyValue(carryVar).trim()
    const accent = styles.getPropertyValue('--accent').trim()
    const shift = progress * 1.2

    ctx.clearRect(0, 0, w, h)
    for (let j = 0; j < rows; j += 1) {
      const t = j / Math.max(1, rows - 1) + shift
      if (t > 1) break
      const solid = t <= SOLID
      const density = Math.min(1, Math.max(0, 1 - (t - SOLID) / 0.84))
      if (!solid && density <= 0) break
      for (let i = 0; i < cols; i += 1) {
        if (!solid && ((i + j) % 2 !== 0 || hash(i, j) > density)) continue
        ctx.fillStyle = !solid && hash(i + 101, j + 57) < ACCENT_SHARE ? accent : carry
        ctx.fillRect(i * cell, j * cell, cell, cell)
      }
    }
  }

  const onResize = () => {
    size()
    draw()
  }
  window.addEventListener('resize', onResize)
  size()
  draw()

  return {
    setProgress(value) {
      if (Math.abs(value - progress) < 0.002) return
      progress = value
      draw()
    },
    destroy() {
      window.removeEventListener('resize', onResize)
    },
  }
}
