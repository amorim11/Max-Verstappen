import { useEffect, useRef, useState } from 'react'
import { DRIVER } from '../data/season'

const LINKS = [
  { href: '#piloto', label: 'Piloto' },
  { href: '#temporada', label: 'Temporada' },
  { href: '#trajetoria', label: 'Trajetória' },
  { href: '#calendario', label: 'Calendário' },
]

function Logo() {
  return (
    <>
      <span className="masthead__logo-num">{DRIVER.number}</span>
      VERSTAPPEN
    </>
  )
}

export default function Nav({ visible }) {
  const [open, setOpen] = useState(false)
  const sheetRef = useRef(null)
  const burgerRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    if (open) closeRef.current?.focus()
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1080px)')
    const onChange = (e) => {
      if (e.matches) setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const close = () => {
    setOpen(false)
    burgerRef.current?.focus()
  }

  // Escape is handled on the document; this keeps Tab inside the open sheet.
  const onSheetKey = (event) => {
    if (event.key !== 'Tab') return
    const focusable = Array.from(sheetRef.current.querySelectorAll('a[href], button'))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <header className={`masthead${visible ? ' is-in' : ''}`} id="masthead">
        <a href="#top" className="masthead__logo" aria-label="Início">
          <Logo />
        </a>

        <nav className="masthead__nav" aria-label="Navegação principal">
          <ul className="masthead__nav-list">
            {LINKS.map((link) => (
              <li key={link.href}><a href={link.href} className="masthead__nav-link">{link.label}</a></li>
            ))}
          </ul>
        </nav>

        <a href="#paddock" className="masthead__garage">
          <span aria-hidden="true">[ </span>Paddock<span aria-hidden="true"> &rarr; ]</span>
        </a>

        <button
          ref={burgerRef}
          className="masthead__burger"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <span></span>
          <span></span>
        </button>
      </header>

      <div
        ref={sheetRef}
        id="mobile-menu"
        className={`mobile-menu${open ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        onKeyDown={onSheetKey}
      >
        <div className="mobile-menu__head">
          <span className="masthead__logo"><Logo /></span>
          <button ref={closeRef} className="mobile-menu__close" aria-label="Fechar menu" onClick={close} tabIndex={open ? 0 : -1}></button>
        </div>
        <nav className="mobile-menu__nav" aria-label="Menu">
          {[...LINKS, { href: '#paddock', label: 'Paddock' }].map((link) => (
            <a key={link.href} href={link.href} className="mobile-menu__link" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  )
}
