import React, { useRef, useLayoutEffect, useState } from "react"
import {
  motion,
  type MotionValue,
  type Variants,
  useTransform,
  useReducedMotion,
} from "motion/react"
import { cn } from "@/lib/utils"

export interface SvgTextZoomProps {
  /** Texto a renderizar en el SVG */
  text: string
  /** Clases CSS para el contenedor exterior */
  className?: string
  /** Clases CSS para el elemento SVG */
  svgClassName?: string
  /** Clases CSS para el elemento <text> (fuente, color, tracking, etc.) */
  textClassName?: string
  /** Carácter o índice (número) hacia el cual se realizará el zoom */
  charFocus?: string | number
  /** Si el carácter se repite, indicar si enfocamos la primera ('first') o la última ('last') coincidencia */
  charOccurrence?: "first" | "last"
  /** Desplazamiento manual en el eje X para calibrar el centro del foco (positivo = derecha, negativo = izquierda) */
  offsetX?: number
  /** Desplazamiento manual en el eje Y para calibrar el centro del foco (positivo = abajo, negativo = arriba) */
  offsetY?: number
  /** Alineación horizontal del texto dentro del SVG ('left' | 'center' | 'right') */
  align?: "left" | "center" | "right"
  /** MotionValue de progreso de scroll (normalmente de 0 a 1) proveniente de useScroll o useSpring */
  progress: MotionValue<number>
  /** Rango del progreso de scroll durante el cual ocurre el zoom [inicio, fin]. Por defecto [0, 0.65] */
  zoomScrollRange?: [number, number]
  /** Rango del progreso de scroll durante el cual el texto se difumina y desvanece [inicio, fin]. Por defecto [0.55, 0.75] */
  fadeScrollRange?: [number, number]
  /** Desvanecimiento máximo de blur en píxeles. Por defecto 12 */
  maxBlur?: number
  /** Ancho final del viewBox en el punto máximo de zoom. Por defecto 20 */
  finalWidth?: number
  /** Alto final del viewBox en el punto máximo de zoom. Por defecto 4 */
  finalHeight?: number
  /** Progreso de scroll en el que el SVG pasa a display: 'none'. Por defecto espera a que termine fadeScrollRange */
  hideThreshold?: number
  /** Si debe tener una animación de entrada física y elegante al entrar al viewport (Emil Kowalski) */
  animateEntry?: boolean
  /** Retardo inicial en segundos para la animación de entrada */
  entryDelay?: number
  /** Retardo de escalonado (stagger) entre cada carácter en segundos. Por defecto 0.08 */
  staggerDelay?: number
  /** Duración de la animación de aparición de cada carácter en segundos. Por defecto 0.35 */
  charDuration?: number
  /** Si la animación de entrada se dispara una sola vez y permanece visible durante el scroll. Por defecto true */
  viewportOnce?: boolean
  /** Si debe activar el efecto de profundidad parallax en las letras durante el zoom. Por defecto true */
  enableParallax?: boolean
  /** Multiplicador general de intensidad del parallax. Por defecto 1.0 */
  parallaxIntensity?: number
}

/**
 * Perfiles artesanales de profundidad y velocidad para cada carácter de "Porqué yo?".
 * La letra objetivo 'O' tiene estrictamente speedX: 0, speedY: 0, scale: 1.0 para mantener
 * su trayectoria perfecta de inmersión.
 */
const DEFAULT_PARALLAX_PROFILES: Record<number, { speedX: number; speedY: number; scale: number }> = {
  0: { speedX: -340, speedY: -50, scale: 1.35 }, // P (primer plano izquierdo, vuela rápido hacia afuera)
  1: { speedX: -210, speedY: 35, scale: 0.85 },  // o (plano de fondo)
  2: { speedX: -280, speedY: 60, scale: 1.25 },  // r (primer plano)
  3: { speedX: -150, speedY: -35, scale: 0.8 },   // q (fondo profundo)
  4: { speedX: -230, speedY: -65, scale: 1.2 },   // u (primer plano medio)
  5: { speedX: -130, speedY: 45, scale: 0.9 },   // é (plano intermedio)
  6: { speedX: 0, speedY: 0, scale: 1.0 },        // espacio
  7: { speedX: -160, speedY: 75, scale: 1.4 },   // y (se abre como cortina hacia abajo-izquierda)
  8: { speedX: 0, speedY: 0, scale: 1.0 },        // o (LETRA OBJETIVO: FIJA EN SU EJE)
  9: { speedX: 240, speedY: -55, scale: 1.35 },  // ? (se abre como cortina hacia arriba-derecha)
}

function getCharParallax(index: number, focusIndex: number) {
  if (index === focusIndex) {
    return { speedX: 0, speedY: 0, scale: 1.0 }
  }
  if (DEFAULT_PARALLAX_PROFILES[index]) {
    return DEFAULT_PARALLAX_PROFILES[index]
  }
  const diff = index - focusIndex
  const dir = diff < 0 ? -1 : 1
  const absDist = Math.abs(diff)
  const isForeground = index % 2 === 0
  return {
    speedX: dir * (90 + absDist * 35),
    speedY: (index % 3 === 0 ? -1 : 1) * (25 + absDist * 10),
    scale: isForeground ? 1.0 + absDist * 0.04 : Math.max(0.75, 1.0 - absDist * 0.03),
  }
}

interface ParallaxCharItemProps {
  char: string
  x: number
  y: number
  isFocus: boolean
  speedX: number
  speedY: number
  targetScale: number
  progress: MotionValue<number>
  zoomScrollRange: [number, number]
  className?: string
  variants?: Variants
}

const ParallaxCharItem: React.FC<ParallaxCharItemProps> = ({
  char,
  x,
  y,
  isFocus,
  speedX,
  speedY,
  targetScale,
  progress,
  zoomScrollRange,
  className,
  variants,
}) => {
  // Para la letra objetivo 'O' (isFocus), no hay movimiento de parallax: permanece 100% fija en su trayectoria
  const offsetX = useTransform(progress, zoomScrollRange, [0, isFocus ? 0 : speedX])
  const offsetY = useTransform(progress, zoomScrollRange, [0, isFocus ? 0 : speedY])
  const scale = useTransform(progress, zoomScrollRange, [1, isFocus ? 1 : targetScale])

  if (char === " " || char === "\u00A0") return null

  return (
    <motion.g
      style={{
        x: offsetX,
        y: offsetY,
        scale: scale,
        transformOrigin: `${x}px ${y}px`,
      }}
    >
      <motion.text
        x={x}
        y={y}
        textAnchor="start"
        dominantBaseline="central"
        className={className}
        variants={variants}
      >
        {char}
      </motion.text>
    </motion.g>
  )
}

/**
 * Función auxiliar para encontrar el índice del carácter solicitado en el texto
 */
function getCharIndex(
  text: string,
  charFocus: string | number,
  charOccurrence: "first" | "last"
): number {
  if (typeof charFocus === "number") {
    return Math.max(0, Math.min(text.length - 1, charFocus))
  }

  if (charOccurrence === "last") {
    const idx = text.lastIndexOf(charFocus)
    return idx !== -1 ? idx : text.length - 1
  }

  const idx = text.indexOf(charFocus)
  return idx !== -1 ? idx : 0
}

interface MeasuredChar {
  char: string
  index: number
  x: number
  y: number
  isFocus: boolean
  speedX: number
  speedY: number
  scale: number
}

/**
 * Componente interactivo que realiza un zoom vectorial cinematográfico en una letra específica
 * conforme el usuario hace scroll, con soporte para auto-detección del glifo y calibración manual.
 */
export const SvgTextZoom: React.FC<SvgTextZoomProps> = ({
  text,
  className,
  svgClassName,
  textClassName = "font-body fill-text text-[90px] tracking-wider",
  charFocus = "o",
  charOccurrence = "last",
  offsetX = 0,
  offsetY = 0,
  align = "left",
  progress,
  zoomScrollRange = [0, 0.65],
  fadeScrollRange = [0.55, 0.75],
  maxBlur: _maxBlur = 12,
  finalWidth = 20,
  finalHeight = 4,
  hideThreshold,
  animateEntry = true,
  entryDelay = 0.05,
  staggerDelay = 0.08,
  charDuration = 0.35,
  viewportOnce = true,
  enableParallax = true,
  parallaxIntensity = 1.0,
}) => {
  void _maxBlur
  const shouldReduceMotion = useReducedMotion()
  const textRef = useRef<SVGTextElement | null>(null)
  const measureTextRef = useRef<SVGTextElement | null>(null)
  const [measuredChars, setMeasuredChars] = useState<MeasuredChar[]>([])

  // Coordenadas base del SVG (1000 de ancho x 200 de alto)
  const svgBaseWidth = 1000
  const svgBaseHeight = 200

  // Configuración de anclaje según alineación
  const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle"
  const defaultTextX = align === "left" ? 0 : align === "right" ? svgBaseWidth : svgBaseWidth / 2
  const defaultTextY = svgBaseHeight / 2 // 100

  // Cálculo heurístico de reserva para el punto objetivo
  const defaultIndex = getCharIndex(text, charFocus, charOccurrence)
  const charRatio = text.length > 0 ? (defaultIndex + 0.5) / text.length : 0.5

  const initialTargetX =
    align === "left"
      ? (svgBaseWidth * 0.65) * charRatio + offsetX
      : align === "right"
      ? svgBaseWidth - (svgBaseWidth * 0.65) * (1 - charRatio) + offsetX
      : svgBaseWidth / 2 + (charRatio - 0.5) * (svgBaseWidth * 0.65) + offsetX

  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number }>({
    x: initialTargetX,
    y: defaultTextY + offsetY,
  })

  // Detección precisa de la posición del carácter y medición para parallax mediante la API nativa de SVG
  useLayoutEffect(() => {
    const el = measureTextRef.current || textRef.current
    if (!el) return

    const updateCoordsAndChars = () => {
      try {
        const idx = getCharIndex(text, charFocus, charOccurrence)

        // 1. Detección del centro de la letra objetivo 'O'
        if (idx >= 0 && idx < text.length && el.getExtentOfChar) {
          const extent = el.getExtentOfChar(idx)
          const measuredX = extent.x + extent.width / 2 + offsetX
          const measuredY = extent.y + extent.height / 2 + offsetY

          setTargetCoords({ x: measuredX, y: measuredY })
        }

        // 2. Medición de cada carácter para el efecto parallax en capas de profundidad
        if (enableParallax) {
          const chars: MeasuredChar[] = []
          for (let i = 0; i < text.length; i++) {
            const ch = text[i]
            let charX = defaultTextX

            if (el.getStartPositionOfChar) {
              try {
                const pt = el.getStartPositionOfChar(i)
                charX = pt.x
              } catch {
                const extent = el.getExtentOfChar?.(i)
                if (extent) charX = extent.x
              }
            } else if (el.getExtentOfChar) {
              try {
                const extent = el.getExtentOfChar(i)
                charX = extent.x
              } catch {}
            }

            const parallax = getCharParallax(i, idx)

            chars.push({
              char: ch,
              index: i,
              x: charX,
              y: defaultTextY,
              isFocus: i === idx,
              speedX: parallax.speedX * parallaxIntensity,
              speedY: parallax.speedY * parallaxIntensity,
              scale: parallax.scale,
            })
          }

          if (chars.length > 0) {
            setMeasuredChars(chars)
          }
        }
      } catch {
        // Si el navegador no soporta APIs nativas en el momento de render, mantiene la estimación
      }
    }

    updateCoordsAndChars()
    document.fonts?.ready.then(updateCoordsAndChars)
    window.addEventListener("resize", updateCoordsAndChars)
    return () => window.removeEventListener("resize", updateCoordsAndChars)
  }, [text, charFocus, charOccurrence, offsetX, offsetY, align, enableParallax, parallaxIntensity])

  // 1. Animación del viewBox para crear el zoom vectorial hacia el carácter objetivo
  // Proyección de trayectoria suave: garantiza que el centro de la 'O' viaje continuamente
  // hacia el centro exacto de la pantalla durante todo el recorrido, eliminando cualquier tirón o salto al final.
  const currentWidth = useTransform(progress, zoomScrollRange, [svgBaseWidth, finalWidth])
  const currentHeight = useTransform(progress, zoomScrollRange, [svgBaseHeight, finalHeight])

  const initialRatioX = targetCoords.x / svgBaseWidth
  const initialRatioY = targetCoords.y / svgBaseHeight

  const screenRatioX = useTransform(progress, zoomScrollRange, [initialRatioX, 0.5])
  const screenRatioY = useTransform(progress, zoomScrollRange, [initialRatioY, 0.5])

  const minX = useTransform(
    [screenRatioX, currentWidth],
    ([ratioX, w]) => targetCoords.x - Number(ratioX) * Number(w)
  )
  const minY = useTransform(
    [screenRatioY, currentHeight],
    ([ratioY, h]) => targetCoords.y - Number(ratioY) * Number(h)
  )

  const viewBox = useTransform(
    [minX, minY, currentWidth, currentHeight],
    ([x, y, w, h]) => `${x} ${y} ${w} ${h}`
  )

  // 2. Animación de opacidad y visibilidad del SVG (sin filtros de blur que degraden el rasterizado vectorial)
  const textOpacity = useTransform(progress, fadeScrollRange, [1, 0])
  const effectiveHideThreshold = hideThreshold ?? (Math.max(zoomScrollRange[1], fadeScrollRange[1]) + 0.02)
  const svgDisplay = useTransform(
    progress,
    (v) => (v >= effectiveHideThreshold ? "none" : "block")
  )

  // Variantes para la animación de entrada con staggerChildren para cada carácter
  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delayChildren: entryDelay,
        staggerChildren: staggerDelay,
      },
    },
  }

  const wordVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: charDuration,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className={cn("relative z-20 flex w-full max-w-6xl pointer-events-none", className)}>
      <motion.svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          opacity: textOpacity,
          display: svgDisplay,
        }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        className={cn("w-full h-auto overflow-visible", svgClassName)}
      >
        {/* Texto oculto para medir posiciones nativas exactas de cada glifo con la tipografía cargada */}
        <text
          ref={measureTextRef}
          x={defaultTextX}
          y={defaultTextY}
          textAnchor={textAnchor}
          dominantBaseline="central"
          xmlSpace="preserve"
          className={textClassName}
          style={{ opacity: 0, pointerEvents: "none" }}
          aria-hidden="true"
        >
          {text}
        </text>

        {enableParallax && measuredChars.length > 0 ? (
          <motion.g
            variants={animateEntry && !shouldReduceMotion ? fadeInVariants : undefined}
            initial={animateEntry && !shouldReduceMotion ? "hidden" : undefined}
            whileInView={animateEntry && !shouldReduceMotion ? "visible" : undefined}
            viewport={{ once: viewportOnce, amount: 0.2 }}
          >
            {measuredChars.map((item) => (
              <ParallaxCharItem
                key={item.index}
                char={item.char}
                x={item.x}
                y={item.y}
                isFocus={item.isFocus}
                speedX={item.speedX}
                speedY={item.speedY}
                targetScale={item.scale}
                progress={progress}
                zoomScrollRange={zoomScrollRange}
                className={textClassName}
                variants={animateEntry && !shouldReduceMotion ? wordVariants : undefined}
              />
            ))}
          </motion.g>
        ) : (
          <motion.text
            ref={textRef}
            x={defaultTextX}
            y={defaultTextY}
            textAnchor={textAnchor}
            dominantBaseline="central"
            xmlSpace="preserve"
            className={textClassName}
            variants={animateEntry && !shouldReduceMotion ? fadeInVariants : undefined}
            initial={animateEntry && !shouldReduceMotion ? "hidden" : undefined}
            whileInView={animateEntry && !shouldReduceMotion ? "visible" : undefined}
            viewport={{ once: viewportOnce, amount: 0.2 }}
          >
            {text.split("").map((char, index) => (
              <motion.tspan
                key={index}
                variants={animateEntry && !shouldReduceMotion ? wordVariants : undefined}
              >
                {char === " " ? "\u00A0" : char}
              </motion.tspan>
            ))}
          </motion.text>
        )}
      </motion.svg>
    </div>
  )
}

export default SvgTextZoom
