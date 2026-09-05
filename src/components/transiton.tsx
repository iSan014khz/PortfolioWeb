import { useEffect, useState } from 'react'
import { motion, type Variants } from 'motion/react'
import { useLenis } from 'lenis/react'

const name = ['S', 'A', 'N', 'T', 'I', 'A', 'G', 'O', ' ', 'P', 'A', 'L', 'M', 'A']

/** Curvas fuertes (Emil): built-ins son demasiado suaves */
const easeOut = [0.23, 1, 0.32, 1] as const
const easeInOut = [0.77, 0, 0.175, 1] as const

/**
 * PADRE: orquesta el stagger de las columnas/letras.
 * El timing fino de cada letra vive en letterDraw.
 */
const container: Variants = {
  initial: { skewX: -40 },
  animate: {
    skewX: 0,
    transition: {
      duration: 1.2,
      ease: easeInOut,
      staggerChildren: 0.05,
    },
  },
}

const item: Variants = {
  initial: { scaleY: 0 },
  animate: {
    // Hold breve en 1 para dar un pelín más de lectura del nombre
    scaleY: [0, 1, 1, 0],
    width: ['100%', '30%', '30%', '100%'],
    transition: {
      duration: 2.3,
      times: [0, 0.32, 0.58, 1],
      ease: easeInOut,
    },
  },
}

/**
 * Animación de letra (máx ~2.2s):
 * 1) aparece + se “dibuja” el trazo
 * 2) el relleno entra suave
 * 3) el stroke se retira y queda solo el fill
 */
const letterDraw: Variants = {
  initial: {
    opacity: 0,
    strokeDashoffset: 360,
    fill: 'rgba(255,255,255,0)',
    strokeOpacity: 1,
  },
  animate: {
    opacity: 1,
    strokeDashoffset: 0,
    fill: 'rgba(255,255,255,1)',
    strokeOpacity: 0,
    transition: {
      opacity: { duration: 0.25, ease: easeOut },
      strokeDashoffset: {
        duration: 1.3,
        ease: easeOut,
      },
      fill: {
        duration: 0.55,
        delay: 1,
        ease: easeInOut,
      },
      strokeOpacity: {
        duration: 0.6,
        delay: 1.55,
        ease: easeInOut,
      },
    },
  },
}

export default function Transition() {
  const lenis = useLenis()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!lenis) return

    lenis.stop()
    const unlock = window.setTimeout(() => {
      lenis.start()
    }, 2800)

    return () => {
      window.clearTimeout(unlock)
    }
  }, [lenis])

  useEffect(() => {
    const hide = window.setTimeout(() => setVisible(false), 2800)
    return () => window.clearTimeout(hide)
  }, [])

  if (!visible) return null

  return (
    // El clip va en un wrapper: overflow-hidden no recorta el skew del mismo nodo
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    <motion.div
      className="flex h-full w-full items-center"
      variants={container}
      initial="initial"
      animate="animate"
    >
      {name.map((letter, index) => (
        <motion.div
          key={index}
          className="relative flex h-full min-w-0 w-full items-center justify-center overflow-hidden bg-accent text-[6rem] font-bold"
          variants={item}
        >
          {letter !== ' ' && (
            <motion.svg
              viewBox="0 0 100 100"
              className="h-full w-full overflow-visible"
              aria-hidden
            >
              <motion.text
                x="50%"
                y="50%"
                dominantBaseline="central"
                textAnchor="middle"
                fontFamily={index < 8 ? 'var(--font-body)' : 'var(--font-contrast)'}
                fontSize="82"
                fontWeight="400"
                stroke="white"
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 360 }}
                variants={letterDraw}
              >
                {letter}
              </motion.text>
            </motion.svg>
          )}
        </motion.div>
      ))}
    </motion.div>
    </div>
  )
}
