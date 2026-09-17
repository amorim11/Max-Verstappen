// Tiny one-shot signals shared by the loading veil, the hero scene and the footer.

const fired = new Map()
const listeners = new Map()

export function signal(name, payload) {
  if (fired.has(name)) return
  fired.set(name, payload)
  listeners.get(name)?.forEach((fn) => fn(payload))
  listeners.delete(name)
}

export function when(name, fn) {
  if (fired.has(name)) {
    fn(fired.get(name))
    return () => {}
  }
  if (!listeners.has(name)) listeners.set(name, new Set())
  listeners.get(name).add(fn)
  return () => listeners.get(name)?.delete(fn)
}

export function setHeroScene(scene) {
  // Handy when tuning the helmet in the browser console.
  if (import.meta.env.DEV) window.__heroScene = scene
}
