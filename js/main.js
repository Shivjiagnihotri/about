import { initArcade } from './games.js'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(pointer: fine)').matches

const loader = document.getElementById('loader')
setTimeout(() => {
  if (loader) loader.classList.add('is-done')
}, 3500)

const yearEl = document.getElementById('year')
if (yearEl) yearEl.textContent = new Date().getFullYear()

if (finePointer) {
  const glow = document.getElementById('cursorGlow')
  if (glow) {
    document.addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px'
      glow.style.top = e.clientY + 'px'
    }, { passive: true })
  }
}

const hamburger = document.getElementById('hamburger')
const navLinks = document.getElementById('navLinks')

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open')
    hamburger.setAttribute('aria-expanded', String(open))
  })
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open')
      hamburger.setAttribute('aria-expanded', 'false')
    })
  })
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'))
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  })
})

const navbar = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  if (navbar) navbar.style.background = window.scrollY > 50 ? 'rgba(6,6,18,0.45)' : 'rgba(6,6,18,0.2)'
}, { passive: true })

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible')
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

  const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-fill').forEach(bar => bar.classList.add('animated'))
        skillObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.3 })
  document.querySelectorAll('.skill-cat').forEach(el => skillObserver.observe(el))

  function sweepReveals() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('visible')
        const cat = el.matches('.skill-cat') ? el : el.querySelector('.skill-cat')
        if (cat) cat.querySelectorAll('.skill-fill').forEach(bar => bar.classList.add('animated'))
      }
    })
  }
  sweepReveals()
  setTimeout(sweepReveals, 1200)
  if (document.readyState === 'complete') sweepReveals()
  else window.addEventListener('load', sweepReveals)
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'))
  document.querySelectorAll('.skill-fill').forEach(bar => bar.classList.add('animated'))
}

if (finePointer && !reducedMotion) {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      card.style.transform = `translateY(-6px) perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`
    })
    card.addEventListener('pointerleave', () => {
      card.style.transform = ''
    })
  })
}

;(function () {
  const btn = document.getElementById('tickerSpeedBtn')
  const track = document.getElementById('ticker')
  if (!btn || !track) return
  const speeds = [1, 2, 3]
  const baseDuration = 46
  let idx = 0
  btn.addEventListener('click', () => {
    idx = (idx + 1) % speeds.length
    const mult = speeds[idx]
    track.style.animationDuration = baseDuration / mult + 's'
    const bolts = Array(mult - 1).fill('⚡').join(' ')
    btn.textContent = (bolts ? bolts + ' ' : '') + 'Speed: ' + mult + 'x'
  })
})()

initArcade(
  document.getElementById('gameCanvas'),
  document.getElementById('gameHint'),
  document.querySelector('.game-tabs')
)

