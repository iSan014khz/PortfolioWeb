import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, useSpring, type MotionValue } from 'motion/react'

type TextSegment = {
  text: string
  className?: string
}

const segments: TextSegment[] = [
  {
    text: 'Hoy navegaste por decenas de sitios web. Mañana no te vas a acordar de ninguno. La mayoría de las páginas se sienten iguales: cumplen con funcionar, pero se olvidan al segundo. Me gusta construir cosas distintas, uniendo la ingeniería de software con el cuidado por el diseño y el movimiento para crear experiencias que ',
  },
  {
    text: 'se sientan vivas.',
    className: 'font-contrast',
  },
]

const wave_factor = 0.05

function ScrollChar({
  char,
  index,
  total,
  scrollYProgress,
  startRange = 0,
  endRange = 1,
  reduced = false,
}: {
  char: string
  index: number
  total: number
  scrollYProgress: MotionValue<number>
  startRange?: number
  endRange?: number
  reduced?: boolean
}) {
  const charRatio = total > 1 ? index / total : 0
  const start = startRange + charRatio * (endRange - startRange)
  const end = Math.min(start + wave_factor, 1)

  const opacity = useTransform(scrollYProgress, [start, end], [reduced ? 1 : 0.1, 1], { clamp: true })
  const y = useTransform(scrollYProgress, [start, end], [reduced ? 0 : 14, 0])

  return (
    <motion.span
      style={{ opacity, y }}
      className="inline-block will-change-transform"
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  )
}

function ScrollAnimatedText({
  segments,
  progress,
  startRange = 0,
  endRange = 1,
  reduced = false,
}: {
  segments: TextSegment[]
  progress: MotionValue<number>
  startRange?: number
  endRange?: number
  reduced?: boolean
}) {
  const total = segments.reduce((acc, seg) => acc + seg.text.length, 0)
  let globalCharIndex = 0

  return (
    <>
      {segments.map((seg, segIdx) => {
        const words = seg.text.split(' ')

        return (
          <span key={segIdx} className={seg.className}>
            {words.map((word, wordIdx) => {
              const isLastWord = wordIdx === words.length - 1
              const letters = word.split('').map((char) => {
                const idx = globalCharIndex++
                return (
                  <ScrollChar
                    key={idx}
                    char={char}
                    index={idx}
                    total={total}
                    scrollYProgress={progress}
                    startRange={startRange}
                    endRange={endRange}
                    reduced={reduced}
                  />
                )
              })

              let spaceChar = null
              if (!isLastWord) {
                const spaceIdx = globalCharIndex++
                spaceChar = (
                  <ScrollChar
                    key={`space-${spaceIdx}`}
                    char=" "
                    index={spaceIdx}
                    total={total}
                    scrollYProgress={progress}
                    startRange={startRange}
                    endRange={endRange}
                    reduced={reduced}
                  />
                )
              }

              return (
                <span key={wordIdx} className="inline-block whitespace-nowrap">
                  {letters}
                  {spaceChar}
                </span>
              )
            })}
          </span>
        )
      })}
    </>
  )
}

export default function About() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end 80%'],
  })

  // Configuración de físicas del resorte (ajusta según la sensación que busques):
  // • stiffness (Rigidez): Mayor = reacciona más rápido y tenso (ej. 100 suave, 300 rápido).
  // • damping (Fricción): Menor = más rebote/inercia (ej. 12 juguetón, 30 sin rebote y seco).
  // • mass (Masa/Peso): Mayor = se siente más pesado y con más inercia tras soltar el scroll.
  // • restDelta: Umbral mínimo para detener el cálculo de físicas y ahorrar recursos.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120, // 150 - 300 (fuerza de atracción)
    damping: 25,    // 10 (mucho rebote) - 35 (cero rebote, frenado en seco)
    mass: 1.5,      // 0.2 (súper ligero) - 1.5 (pesado y cinematográfico)
    restDelta: 0.001,
  })

  const activeProgress = reduced ? scrollYProgress : smoothProgress

  return (
    <section
      ref={ref}
      id="about"
      className="flex min-h-svh w-full flex-col items-center justify-start px-5 sm:px-8 md:px-12 py-16 sm:py-20 md:py-24"
    >
      <div className="flex w-full max-w-2xl flex-col">
        <p className="text-left font-body text-3xl sm:text-2xl md:text-3xl tracking-tight leading-relaxed text-text text-pretty">
          <ScrollAnimatedText
            segments={segments}
            progress={activeProgress}
            startRange={0}
            endRange={1}
            reduced={reduced}
          />
        </p>
      </div>
    </section>
  )
}
