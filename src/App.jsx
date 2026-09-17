import { useEffect, useRef } from 'react'
import LoadingVeil from './components/LoadingVeil'
import Hero from './components/Hero'
import Season from './components/Season'
import Timeline from './components/Timeline'
import Paddock from './components/Paddock'
import Footer from './components/Footer'
import { stackLayers, startSmoothScroll } from './lib/scrollFx'

export default function App() {
  const heroInner = useRef(null)
  const heroShade = useRef(null)
  const seasonLayer = useRef(null)
  const seasonInner = useRef(null)
  const seasonShade = useRef(null)
  const timelineLayer = useRef(null)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const stopScroll = startSmoothScroll()
    const stopStack = stackLayers([
      { inner: heroInner.current, shade: heroShade.current, next: seasonLayer.current },
      { inner: seasonInner.current, shade: seasonShade.current, next: timelineLayer.current },
    ])
    return () => {
      stopScroll()
      stopStack()
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">Pular para o conteúdo</a>
      <LoadingVeil />
      <main id="main">
        <div className="stack">
          <div className="stack__layer stack__layer--hero">
            <div className="stack__inner" ref={heroInner}>
              <Hero />
              <div className="stack__shade" ref={heroShade}></div>
            </div>
          </div>
          <div className="stack__layer stack__layer--season" ref={seasonLayer}>
            <div className="stack__inner" ref={seasonInner}>
              <Season />
              <div className="stack__shade" ref={seasonShade}></div>
            </div>
          </div>
          <div className="stack__timeline" ref={timelineLayer}>
            <Timeline />
          </div>
        </div>
        <Paddock />
      </main>
      <Footer />
    </>
  )
}
