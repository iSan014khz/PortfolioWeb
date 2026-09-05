import React, { useRef, useLayoutEffect, useState } from "react"
import {
  motion,
  type MotionValue,
  useTransform,
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
  maxBlur = 12,
  finalWidth = 20,
  finalHeight = 4,
  hideThreshold,
}) => {
  const textRef = useRef<SVGTextElement | null>(null)

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

  // Detección precisa de la posición del carácter mediante la API nativa de SVG
  useLayoutEffect(() => {
    if (!textRef.current) return

    const updateCoords = () => {
      try {
        const idx = getCharIndex(text, charFocus, charOccurrence)
        if (idx >= 0 && idx < text.length && textRef.current?.getExtentOfChar) {
          const extent = textRef.current.getExtentOfChar(idx)
          const measuredX = extent.x + extent.width / 2 + offsetX
          const measuredY = extent.y + extent.height / 2 + offsetY

          setTargetCoords({ x: measuredX, y: measuredY })
        }
      } catch {
        // Si el navegador no soporta getExtentOfChar en el momento de render, mantiene la estimación
      }
    }

    updateCoords()
    document.fonts?.ready.then(updateCoords)
    window.addEventListener("resize", updateCoords)
    return () => window.removeEventListener("resize", updateCoords)
  }, [text, charFocus, charOccurrence, offsetX, offsetY, align])

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

  // 2. Animación de opacidad, desenfoque (blur) y visibilidad del SVG
  const textOpacity = useTransform(progress, fadeScrollRange, [1, 0])
  const blur = useTransform(progress, fadeScrollRange, ["blur(0px)", `blur(${maxBlur}px)`])
  const effectiveHideThreshold = hideThreshold ?? (Math.max(zoomScrollRange[1], fadeScrollRange[1]) + 0.02)
  const svgDisplay = useTransform(
    progress,
    (v) => (v >= effectiveHideThreshold ? "none" : "block")
  )

  return (
    <div
      className={cn("relative z-20 flex w-full max-w-6xl pointer-events-none will-change-transform", className)}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      <motion.svg
        viewBox={viewBox}
        style={{
          opacity: textOpacity,
          filter: blur,
          display: svgDisplay,
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        className={cn("w-full h-auto overflow-visible will-change-transform", svgClassName)}
      >
        <text
          ref={textRef}
          x={defaultTextX}
          y={defaultTextY}
          textAnchor={textAnchor}
          dominantBaseline="central"
          className={cn(textClassName, "will-change-transform")}
          style={{
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
          }}
        >
          {text}
        </text>
      </motion.svg>
    </div>
  )
}

export default SvgTextZoom
