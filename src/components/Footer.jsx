import { useEffect, useRef } from 'react'
import Cta from './Cta'
import { ContourCanvas } from './SectionFx'
import { CREDITS, HERO_CREDITS } from '../photoCredits'
import { DRIVER, UPDATED_AT } from '../data/season'
import driverShot from '../assets/images/verstappen-cutout.webp'
import { useHeadingReveal } from '../hooks/useRevealText'
import { onceInView, prefersReducedMotion, showUnits, splitText } from '../lib/splitText'
import { passProgress, watchScroll } from '../lib/scrollFx'

const LINKS = [
  { href: '#piloto', label: 'Piloto' },
  { href: '#temporada', label: 'Temporada' },
  { href: '#trajetoria', label: 'Trajetória' },
  { href: '#calendario', label: 'Calendário' },
  { href: '#paddock', label: 'Paddock' },
]

export default function Footer() {
  const footerRef = useRef(null)
  const figureRef = useRef(null)
  const navRef = useRef(null)
  const logoRef = useRef(null)
  const bottomRef = useRef(null)
  const headingRef = useHeadingReveal()

  useEffect(() => {
    const footer = footerRef.current
    const links = Array.from(navRef.current.querySelectorAll('.footer__nav-link')).map((el) =>
      splitText(el, { unit: 'letter', stagger: 22 })
    )
    const timers = []
    const stopIn = onceInView(footer, () => {
      timers.push(window.setTimeout(() => logoRef.current?.classList.add('is-in'), 120))
      links.forEach((line, i) => timers.push(window.setTimeout(() => showUnits(line), 260 + i * 80)))
      timers.push(window.setTimeout(() => bottomRef.current?.classList.add('is-in'), 640))
    })
    const stopParallax = prefersReducedMotion()
      ? () => {}
      : watchScroll(footer, () => {
          if (figureRef.current) figureRef.current.style.transform = `translateY(${(1 - passProgress(footer)) * 60}px)`
        })
    return () => {
      stopIn()
      stopParallax()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <footer className="footer" ref={footerRef}>
      <div className="footer__panel">
        <ContourCanvas className="footer__contour" colorVar="--contour-dark" />

        <div className="footer__figure" ref={figureRef} aria-hidden="true">
          <div className="footer__figure-box">
            <img className="footer__driver" src={driverShot} alt="" />
          </div>
        </div>

        <span className="footer__logo" ref={logoRef}>V{DRIVER.number}</span>
        <h2 className="footer__masthead heading-lines" ref={headingRef}>
          <span data-line>simply</span>
          <br />
          <span data-line>lovely</span>
          <span className="footer__masthead-dot reveal-dot">.</span>
        </h2>

        <nav className="footer__nav" aria-label="Rodapé" ref={navRef}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="footer__nav-link">{link.label}</a>
          ))}
        </nav>

        <div className="footer__bottom" ref={bottomRef}>
          <div className="footer__legal">
            <p className="footer__copyright">
              &copy; 2026 Projeto de fã não oficial. Não afiliado a Max Verstappen, Oracle Red Bull Racing ou Fórmula 1.
              Dados da temporada conferidos no formula1.com em {UPDATED_AT}.
            </p>
            <p className="footer__credits">
              Fotos via Wikimedia Commons, todas editadas:{' '}
              {Object.values(CREDITS).map((credit, i, all) => (
                <span key={credit.url}>
                  <a href={credit.url} target="_blank" rel="noopener">{credit.author}</a> ({credit.license})
                  {i < all.length - 1 ? ', ' : '. '}
                </span>
              ))}
              Hero, uso editorial —{' '}
              {HERO_CREDITS.map((credit, i, all) => (
                <span key={credit.label}>
                  {credit.label}:{' '}
                  <a href={credit.url} target="_blank" rel="noopener">{credit.author}</a>
                  {i < all.length - 1 ? '; ' : '. '}
                </span>
              ))}
              Traçados:{' '}
              <a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noopener">bacinger/f1-circuits</a> (MIT).
            </p>
          </div>
          <Cta href="#top" label="voltar ao topo" className="cta--on-dark" />
        </div>
      </div>
    </footer>
  )
}
