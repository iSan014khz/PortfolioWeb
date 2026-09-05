import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AsciiVideo } from '@/components/ui/ascii-video'

const ASCII_START_DELAY_MS = 2800

export default function Hero() {
  const [playAscii, setPlayAscii] = useState(false)
  const reduced = useReducedMotion() ?? false

  useEffect(() => {
    const start = window.setTimeout(() => setPlayAscii(true), ASCII_START_DELAY_MS)
    return () => window.clearTimeout(start)
  }, [])

  return (
    <section
      id="hero"
      className="relative flex min-h-svh w-full flex-col justify-between overflow-hidden px-5 sm:px-8 md:px-12 py-12 sm:py-16 md:py-20 text-text"
    >
      {playAscii && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full mask-b-from-45% mask-b-to-100%"
        >
          <AsciiVideo
            className="h-full w-full"
            color="var(--color-muted)"
            backgroundColor="var(--color-bg)"
            animation="none"
            interaction="none"
            loop={!reduced}
            typeLoop
            playing={!reduced}
          />
        </motion.div>
      )}

      {/* Degradado superior para suavizar el inicio de los caracteres */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 sm:h-52 bg-gradient-to-b from-bg via-bg/90 to-transparent z-10"
      />

      {/* Degradado inferior para fundir el ASCII perfectamente con el fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 sm:h-64 bg-gradient-to-t from-bg via-bg/80 to-transparent z-10"
      />

      <p className="pointer-events-none relative z-10 max-w-xs font-display text-[15px] font-semibold leading-snug tracking-editorial text-text -mt-2.5">
        Transformo tus <span className="text-text font-display">ideas</span> en experiencias memorables.
      </p>

      <div className="pointer-events-none relative z-10 mb-10">
        <h1 className="flex flex-wrap items-baseline justify-between gap-x-3 font-display text-name leading-none tracking-editorial">
          <span>Santiago</span>
          <span className="font-contrast">Palma</span>
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
      </div>
    </section>
  )
}