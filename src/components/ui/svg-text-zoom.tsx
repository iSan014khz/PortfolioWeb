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
  /** Desenfoque máximo por profundidad, medido en píxeles de PANTALLA. 0 lo desactiva. Por defecto 8 */
  maxBlur?: number
  /**
   * Desenfoque de salida en píxeles de pantalla, aplicado al conjunto del titular en el tramo
   * final del recorrido para que se disuelva al atravesar la lente en vez de sólo apagarse.
   * 0 lo desactiva. Por defecto 16
   */
  exitBlur?: number
  /**
   * Rango de scroll del desenfoque de salida [inicio, fin]. Si se omite, se deriva de
   * fadeScrollRange: entra en el último ~70% del fundido y alcanza el máximo poco antes de
   * la transparencia total, de modo que el desenfoque llegue a verse.
   */
  exitBlurRange?: [number, number]
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
  /** Fracción del recorrido de zoom en la que el encuadre termina de centrarse en el foco. Por defecto 0.62 */
  panSettle?: number
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Suavizado simétrico (smoothstep): arranque y llegada calmados, centro sostenido. */
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * Profundidad óptica `z` de cada carácter dentro de la escena.
 *
 *   z < 1  → primer plano: se separa del eje óptico más rápido que la lente y sale de cuadro
 *   z = 1  → plano focal: viaja exactamente con el zoom (es el caso de la letra objetivo)
 *   z > 1  → fondo: se rezaga y crece más despacio que el encuadre
 *
 * Se deriva de la distancia al foco, así que funciona con cualquier texto sin calibrar a mano.
 */
function getCharDepth(index: number, focusIndex: number, total: number): number {
  if (index === focusIndex) return 1
  const dist = Math.abs(index - focusIndex)
  const norm = total > 1 ? dist / (total - 1) : 0
  const spread = 0.14 + norm * 0.3
  const isForeground = (index + focusIndex) % 2 === 0
  return isForeground ? 1 - spread : 1 + spread * 1.7
}

/**
 * Recorrido óptico (|log k|) en el que una letra alcanza su desenfoque máximo. Bajarlo adelanta
 * la entrada del desenfoque para todas, pero sobre todo para las que más se acercan a la pantalla,
 * porque son las que acumulan recorrido más rápido.
 */
const BLUR_TRAVEL_FULL = 1.2

/**
 * Factor de zoom ficticio desde el que las letras entran a escena. Es el mismo parámetro que el
 * scroll hace crecer durante el travelling, pero congelado: al evaluar la homotecia de cada letra
 * en este valor se obtiene su posición "de partida" en su propio plano. Subirlo aleja el punto de
 * origen y exagera la entrada; bajarlo la vuelve más contenida.
 */
const ENTRY_FAR = 6

/**
 * La letra objetivo tiene exponente 0 (está en el plano focal) y por tanto no entraría con ningún
 * movimiento. Se le presta un exponente mínimo para que se asiente en vez de aparecer de golpe.
 */
const FOCUS_ENTRY_EXPONENT = 0.1

/** Deriva vertical determinista por índice, en el rango [-1, 1]. */
function getCharDrift(index: number): number {
  return (((index * 37) % 11) - 5) / 5
}

interface ParallaxCharItemProps {
  char: string
  x: number
  y: number
  depth: number
  drift: number
  isFocus: boolean
  focusX: number
  focusY: number
  zoomT: MotionValue<number>
  zoomFactor: MotionValue<number>
  maxBlur: number
  intensity: number
  animateEntry: boolean
  charDuration: number
  className?: string
}

/**
 * Un carácter proyectado a su profundidad.
 *
 * Toda la transformación es una homotecia de razón `k` centrada en el punto de foco, donde
 * `k = zoomFactor^(1/z - 1)`. Es la proyección estenopeica exacta de un travelling frontal:
 * una sola razón describe a la vez cuánto se aleja el glifo del eje óptico y cuánto cambia su
 * tamaño aparente. La letra objetivo tiene z = 1 → k = 1 → queda clavada sin ningún caso especial.
 */
const ParallaxCharItem: React.FC<ParallaxCharItemProps> = ({
  char,
  x,
  y,
  depth,
  drift,
  isFocus,
  focusX,
  focusY,
  zoomT,
  zoomFactor,
  maxBlur,
  intensity,
  animateEntry,
  charDuration,
  className,
}) => {
  const exponent = (1 / depth - 1) * intensity

  // Razón de la homotecia: posición respecto al eje y escala aparente en un solo número
  const k = useTransform(zoomFactor, (f) => (isFocus ? 1 : Math.pow(f, exponent)))

  // Deriva vertical proporcional a log(k), equilibrada entre primer plano y fondo
  const offsetY = useTransform(k, (v) =>
    isFocus ? 0 : Math.log(Math.max(v, 1e-6)) * drift * 14 * intensity
  )

  // El primer plano atraviesa la lente y se disuelve pronto; el fondo se atenúa hacia un piso
  const isForeground = depth < 1
  const charOpacity = useTransform(
    zoomT,
    isForeground ? [0, 0.1, 0.52] : [0, 0.3, 0.88],
    isFocus ? [1, 1, 1] : isForeground ? [1, 1, 0] : [1, 1, 0.18]
  )

  // Amplitud del desenfoque por profundidad. El primer plano pesa más: es el que se abalanza
  // sobre la lente, así que debe salir de foco antes y más fuerte que el fondo.
  const depthBlur = isFocus
    ? 0
    : Math.min(1, Math.abs(1 - depth) * (isForeground ? 2 : 0.9)) * maxBlur

  // El momento de entrada NO es uniforme: lo marca `travel = |log k|`, el recorrido óptico que
  // la letra lleva acumulado. Como k es la razón de la homotecia, ese recorrido crece deprisa en
  // las letras que se acercan a la pantalla y despacio en las del fondo, de modo que las primeras
  // empiezan a desenfocarse bastante antes sin necesidad de temporizarlas a mano.
  //
  // El desenfoque se expresa en px de PANTALLA y se convierte a unidades de usuario dividiendo por
  // la escala total acumulada (zoom del viewBox × escala propia del glifo). Sin esa corrección un
  // blur(4px) acabaría midiendo cientos de píxeles reales en el tramo final del zoom.
  const blurFilter = useTransform([zoomFactor, k], ([f, scale]) => {
    if (depthBlur <= 0) return "none"
    const travel = Math.abs(Math.log(Math.max(Number(scale), 1e-6)))
    const screenPx = depthBlur * clamp01(travel / BLUR_TRAVEL_FULL)
    if (screenPx < 0.15) return "none"
    const userUnits = screenPx / Math.max(Number(f) * Number(scale), 1e-6)
    return `blur(${userUnits.toFixed(4)}px)`
  })

  // \u2500\u2500 Entrada: la letra aterriza DESDE su propio plano \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Es la misma homotecia de arriba, evaluada en un factor de zoom ficticio (ENTRY_FAR) en lugar
  // del que dicta el scroll. As\u00ED el primer plano llega enorme y desenfocado, el fondo llega
  // peque\u00F1o, y ambos se posan en el plano focal (raz\u00F3n 1). El scroll despu\u00E9s los devuelve a esos
  // mismos planos: entrada y salida quedan descritas por una \u00FAnica f\u00EDsica.
  //
  // Va en un grupo ANIDADO porque dos homotecias con el mismo centro se componen multiplicando
  // sus razones, de modo que la entrada y el travelling del scroll conviven sin pisarse.
  const entryExponent = isFocus ? FOCUS_ENTRY_EXPONENT : exponent
  const entryScale = Math.min(4.5, Math.max(0.4, Math.pow(ENTRY_FAR, entryExponent)))
  const entryTravel = Math.abs(Math.log(entryScale))
  const entryY = -Math.log(entryScale) * drift * 18 * intensity
  const entryBlur = isFocus ? 0 : Math.min(1, entryTravel) * maxBlur * 0.5

  const entryVariants: Variants = {
    hidden: {
      scale: entryScale,
      y: entryY,
      opacity: 0,
      filter: entryBlur > 0.05 ? `blur(${entryBlur.toFixed(2)}px)` : "blur(0px)",
    },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        default: { type: "spring", stiffness: 130, damping: 19, mass: 0.9 },
        opacity: { duration: charDuration, ease: "easeOut" },
        filter: { duration: charDuration * 1.7, ease: "easeOut" },
      },
    },
  }

  if (char === " " || char === "\u00A0") return null

  return (
    <motion.g
      style={{
        scale: k,
        y: offsetY,
        opacity: charOpacity,
        filter: blurFilter,
        transformOrigin: `${focusX}px ${focusY}px`,
      }}
    >
      <motion.g
        variants={animateEntry ? entryVariants : undefined}
        style={{ transformOrigin: `${focusX}px ${focusY}px` }}
      >
        <text
          x={x}
          y={y}
          textAnchor="start"
          dominantBaseline="central"
          className={className}
        >
          {char}
        </text>
      </motion.g>
    </motion.g>
  )
}

/**
 * Índice (en graphemes) del carácter solicitado dentro del texto.
 */
function getCharIndex(
  chars: string[],
  charFocus: string | number,
  charOccurrence: "first" | "last"
): number {
  if (typeof charFocus === "number") {
    return Math.max(0, Math.min(chars.length - 1, charFocus))
  }

  if (charOccurrence === "last") {
    const idx = chars.lastIndexOf(charFocus)
    return idx !== -1 ? idx : chars.length - 1
  }

  const idx = chars.indexOf(charFocus)
  return idx !== -1 ? idx : 0
}

interface MeasuredChar {
  char: string
  index: number
  x: number
  y: number
  isFocus: boolean
  depth: number
  drift: number
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
  maxBlur = 8,
  exitBlur = 16,
  exitBlurRange,
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
  panSettle = 0.62,
}) => {
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
  const graphemes = Array.from(text)
  const defaultIndex = getCharIndex(graphemes, charFocus, charOccurrence)
  const charRatio = graphemes.length > 0 ? (defaultIndex + 0.5) / graphemes.length : 0.5

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
        const chars = Array.from(text)
        const idx = getCharIndex(chars, charFocus, charOccurrence)

        // getExtentOfChar indexa por unidad de código UTF-16 mientras que `chars` indexa por
        // grapheme: se acumula el desplazamiento para que los acentos no descuadren el mapeo.
        const codeUnitAt: number[] = []
        let offset = 0
        for (const ch of chars) {
          codeUnitAt.push(offset)
          offset += ch.length
        }

        const extentOf = (i: number) => {
          if (!el.getExtentOfChar) return null
          try {
            return el.getExtentOfChar(codeUnitAt[i])
          } catch {
            return null
          }
        }

        // 1. Centro exacto de la letra objetivo: es el eje óptico de todo el movimiento
        const focusExtent = idx >= 0 && idx < chars.length ? extentOf(idx) : null
        if (focusExtent) {
          setTargetCoords({
            x: focusExtent.x + focusExtent.width / 2 + offsetX,
            y: focusExtent.y + focusExtent.height / 2 + offsetY,
          })
        }

        // 2. Medición de cada carácter para el efecto parallax en capas de profundidad
        if (enableParallax) {
          const measured: MeasuredChar[] = []
          for (let i = 0; i < chars.length; i++) {
            const extent = extentOf(i)
            measured.push({
              char: chars[i],
              index: i,
              // El borde izquierdo de la celda del glifo ya incorpora el kerning del par
              x: extent ? extent.x : defaultTextX,
              y: defaultTextY,
              isFocus: i === idx,
              depth: getCharDepth(i, idx, chars.length),
              drift: getCharDrift(i),
            })
          }

          if (measured.length > 0) {
            setMeasuredChars(measured)
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
  }, [text, charFocus, charOccurrence, offsetX, offsetY, align, enableParallax, defaultTextX, defaultTextY])

  // 1. Progreso normalizado y suavizado del recorrido de zoom
  const [zoomStart, zoomEnd] = zoomScrollRange
  const zoomT = useTransform(progress, (v) => {
    const span = zoomEnd - zoomStart
    return smoothstep(clamp01(span === 0 ? 0 : (v - zoomStart) / span))
  })

  // 2. Zoom GEOMÉTRICO del viewBox.
  // Interpolar el ancho linealmente concentra casi todo el efecto perceptible en el último tramo
  // del scroll, porque el ojo lee el acercamiento en escala logarítmica: con 1000 → 6.5 lineal,
  // la mitad del recorrido entrega apenas un 14% del zoom percibido. Progresando el ancho de forma
  // exponencial, la velocidad de acercamiento se percibe constante de principio a fin.
  const widthRatio = Math.log(finalWidth / svgBaseWidth)
  const heightRatio = Math.log(finalHeight / svgBaseHeight)
  const currentWidth = useTransform(zoomT, (t) => svgBaseWidth * Math.exp(widthRatio * t))
  const currentHeight = useTransform(zoomT, (t) => svgBaseHeight * Math.exp(heightRatio * t))

  // Escala aparente acumulada respecto al encuadre inicial (1 → svgBaseWidth / finalWidth)
  const zoomFactor = useTransform(currentWidth, (w) => svgBaseWidth / Math.max(w, 1e-6))

  const initialRatioX = targetCoords.x / svgBaseWidth
  const initialRatioY = targetCoords.y / svgBaseHeight

  // El encuadre termina de centrarse sobre el foco antes de que acabe el zoom: primero la cámara
  // compone y después sólo avanza. Un travelling real no sigue corrigiendo el encuadre al final.
  const panT = useTransform(zoomT, (t) => smoothstep(clamp01(t / Math.max(panSettle, 1e-6))))
  const screenRatioX = useTransform(panT, (t) => initialRatioX + (0.5 - initialRatioX) * t)
  const screenRatioY = useTransform(panT, (t) => initialRatioY + (0.5 - initialRatioY) * t)

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

  // 3. Animación de opacidad y visibilidad del SVG
  const textOpacity = useTransform(progress, fadeScrollRange, [1, 0])

  // 4. Desenfoque de salida: el titular se disuelve al atravesar la lente en lugar de apagarse.
  // Va sobre el elemento SVG y no dentro del viewBox, así que sus píxeles son de pantalla reales
  // y no hay que corregirlos por el zoom. Alcanza el máximo ANTES de la transparencia total
  // (por defecto al 85% del fundido) para que el desenfoque llegue a verse en pantalla.
  const [fadeStart, fadeEnd] = fadeScrollRange
  const fadeSpan = fadeEnd - fadeStart
  const [blurStart, blurEnd] = exitBlurRange ?? [
    fadeStart + fadeSpan * 0.3,
    fadeStart + fadeSpan * 0.85,
  ]
  const exitBlurFilter = useTransform(progress, (v) => {
    if (exitBlur <= 0) return "none"
    const span = blurEnd - blurStart
    const t = clamp01(span === 0 ? (v >= blurEnd ? 1 : 0) : (v - blurStart) / span)
    const px = smoothstep(t) * exitBlur
    return px < 0.1 ? "none" : `blur(${px.toFixed(2)}px)`
  })

  const effectiveHideThreshold = hideThreshold ?? (Math.max(zoomScrollRange[1], fadeScrollRange[1]) + 0.02)
  const svgDisplay = useTransform(
    progress,
    (v) => (v >= effectiveHideThreshold ? "none" : "block")
  )

  // Con movimiento reducido se conserva el fundido (no es vestibular) pero se anula el travelling
  // de 150x y el parallax, que sí lo son.
  const staticViewBox = `0 0 ${svgBaseWidth} ${svgBaseHeight}`
  const useParallax = enableParallax && !shouldReduceMotion && measuredChars.length > 0

  // El grupo padre sólo ORQUESTA el escalonado: no anima opacidad propia, porque un fundido de
  // grupo se multiplicaría con el de cada letra y emborronaría el escalonado.
  const fadeInVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
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
        viewBox={shouldReduceMotion ? staticViewBox : viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={text}
        style={{
          opacity: textOpacity,
          display: svgDisplay,
          filter: exitBlurFilter,
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

        {useParallax ? (
          <motion.g
            aria-hidden="true"
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
                depth={item.depth}
                drift={item.drift}
                isFocus={item.isFocus}
                focusX={targetCoords.x}
                focusY={targetCoords.y}
                zoomT={zoomT}
                zoomFactor={zoomFactor}
                maxBlur={maxBlur}
                intensity={parallaxIntensity}
                animateEntry={animateEntry && !shouldReduceMotion}
                charDuration={charDuration}
                className={textClassName}
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
            aria-hidden="true"
            className={textClassName}
            variants={animateEntry && !shouldReduceMotion ? fadeInVariants : undefined}
            initial={animateEntry && !shouldReduceMotion ? "hidden" : undefined}
            whileInView={animateEntry && !shouldReduceMotion ? "visible" : undefined}
            viewport={{ once: viewportOnce, amount: 0.2 }}
          >
            {Array.from(text).map((char, index) => (
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
