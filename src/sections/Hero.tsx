import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Container, Section } from '@/components/Section'
import { fetchAsciiFrames } from '@/lib/ascii-frames'
import './hero.css'

const loadAscii = () => import('@/components/ui/ascii-video').then(m => ({ default: m.AsciiVideo }))
const AsciiVideo = lazy(loadAscii)

// El grid ASCII es 9:16. En la relacion de aspecto de un telefono la diferencia es minima y el
// estirado original es justo el encuadre que ya esta aprobado, asi que el recorte solo entra a
// partir de tablet, que es donde el lienzo se vuelve apaisado y el estirado se rompe de verdad.
const WIDE_QUERY = '(min-width: 768px)'

export default function Hero() {
  const [playAscii, setPlayAscii] = useState(false)
  const [asciiVisible, setAsciiVisible] = useState(false)
  const [posterReady, setPosterReady] = useState(false)
  const [isWide, setIsWide] = useState(false)
  const reduced = useReducedMotion() ?? false

  useEffect(() => {
    if (reduced) return
    let cancelled = false
    // Leave the first paint to the poster and text; prepare code and data together.
    const frame = window.requestAnimationFrame(() => {
      // If the code cannot be fetched, keep the poster instead of throwing from Suspense.
      void loadAscii().then(() => { if (!cancelled) setPlayAscii(true) }).catch(() => {})
      void fetchAsciiFrames().catch(() => {})
    })
    return () => { cancelled = true; window.cancelAnimationFrame(frame) }
  }, [reduced])

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY)
    const sync = () => setIsWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <Section
      id="hero"
      pad="tight"
      className="relative flex min-h-[calc(100svh-var(--spacing-nav-height))] flex-col justify-between overflow-hidden text-text"
    >
      <div aria-hidden="true" data-ready={posterReady || asciiVisible} className="hero-backdrop pointer-events-none absolute inset-0 h-full w-full mask-b-from-45% mask-b-to-100%">
        <img
          src="/hero-ascii-poster.webp"
          alt=""
          width="720"
          height="1280"
          fetchPriority="high"
          loading="eager"
          onLoad={() => setPosterReady(true)}
          className="hero-poster absolute inset-0 h-full w-full object-fill md:object-cover"
        />
      {playAscii && !reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: asciiVisible ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 h-full w-full"
        >
          <Suspense fallback={null}>
            <AsciiVideo
              className="h-full w-full"
              color="var(--color-muted)"
              backgroundColor="var(--color-bg)"
              animation="none"
              interaction="none"
              fit={isWide ? 'cover' : 'stretch'}
              loop={!reduced}
              typeLoop
              playing={!reduced}
              onFirstFrame={() => setAsciiVisible(true)}
            />
          </Suspense>
        </motion.div>
      )}
      </div>

      {/* Degradado superior para suavizar el inicio de los caracteres */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[max(11rem,21vh)] bg-gradient-to-b from-bg via-bg/90 to-transparent z-10"
      />

      {/* Degradado inferior para fundir el ASCII perfectamente con el fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[max(12rem,23vh)] bg-gradient-to-t from-bg via-bg/80 to-transparent z-10"
      />

      <Container className="pointer-events-none relative z-10">
        <p className="hero-intro-copy max-w-xs md:max-w-sm lg:max-w-md font-display text-[15px] md:text-base lg:text-lg font-semibold leading-snug tracking-editorial text-text -mt-2.5">
          Transformo tus <span className="text-text font-display">ideas</span> en experiencias memorables.
        </p>
      </Container>

      <Container className="pointer-events-none relative z-10 mb-10">
        <h1 className="flex flex-wrap items-baseline justify-between gap-x-3 font-display text-name md:text-name-lg leading-none tracking-editorial">
          <span className="hero-name-mask"><span className="hero-intro-first-name">Santiago</span></span>
          <span className="hero-name-mask"><span className="hero-intro-last-name font-contrast">Palma</span></span>
        </h1>

        {/* <nav className="pointer-events-auto mt-3 flex items-center justify-between gap-2 overflow-hidden rounded-full border border-text/20 px-3 py-1 font-display font-semibold uppercase tracking-wide text-muted">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              className="[@media(hover:hover)_and_(pointer:fine)]:hover:opacity-70"
            >
              {social.label}
            </a>
          ))}
        </nav> */}
      </Container>
    </Section>
  )
}
