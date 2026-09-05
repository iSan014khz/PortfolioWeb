  import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion'
import { cn } from '@/lib/cn'
import defaultMeta from '../../data/ascii-video/meta.json'
import defaultFramesUrl from '../../data/ascii-video/frames.bin?url'
import defaultColorsUrl from '../../data/ascii-video/colors.bin?url'

const easeOut = [0.23, 1, 0.32, 1] as const
const easeInOut = [0.77, 0, 0.175, 1] as const

export const ASCII_INTERACTION = {
  type: 'spring' as 'ease' | 'spring',
  radius: 0.16,
  force: 0.04,
  durationOut: 0.45,
  duration: 0.45,
  springOut: { type: 'spring' as const, bounce: 0.3 },
  springBack: { type: 'spring' as const, bounce: 0.3 },
}

type AsciiMeta = {
  cols: number
  rows: number
  fps: number
  frameCount: number
  charset: string
  hasColors?: boolean
}

type AsciiVideoProps = {
  meta?: AsciiMeta
  framesUrl?: string
  colorsUrl?: string
  charset?: string
  color?: string | 'natural'
  backgroundColor?: string
  fps?: number
  loop?: boolean
  typeLoop?: boolean
  playing?: boolean
  interactive?: boolean
  interaction?: 'click' | 'hover' | 'none'
  type?: 'ease' | 'spring'
  animation?: 'none' | 'fade'
  animationDuration?: number
  className?: string
}

let dummyColorElement: HTMLElement | null = null

function parseCssColor(colorStr: string, fallback = '#f0f0f0'): [number, number, number, number] {
  const query = colorStr || fallback

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return [0.94, 0.94, 0.94, 1.0]
  }

  if (!dummyColorElement) {
    dummyColorElement = document.createElement('span')
    dummyColorElement.style.display = 'none'
    document.body.appendChild(dummyColorElement)
  }

  dummyColorElement.style.color = query
  const computed = getComputedStyle(dummyColorElement).color
  const match = computed.match(/[\d.]+/g)
  let result: [number, number, number, number] = [0.94, 0.94, 0.94, 1.0]

  if (match && match.length >= 3) {
    const r = Number(match[0]) / 255
    const g = Number(match[1]) / 255
    const b = Number(match[2]) / 255
    const a = match.length >= 4 ? Number(match[3]) : 1.0
    result = [r, g, b, a]
  }

  return result
}

const pingPongIndex = (rawIndex: number, frameCount: number) => {
  if (frameCount <= 1) return 0
  const period = (frameCount - 1) * 2
  const t = rawIndex % period
  return t < frameCount ? t : period - t
}

const VS_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FS_SOURCE = `
precision mediump float;
varying vec2 v_uv;

uniform sampler2D u_glyphData;
uniform sampler2D u_colorData;
uniform sampler2D u_glyphAtlas;
uniform vec2 u_gridSize;
uniform vec2 u_resolution;
uniform float u_glyphCount;
uniform int u_isDots;
uniform vec3 u_bgColor;
uniform vec4 u_textColor;
uniform int u_useNaturalColor;

uniform vec4 u_ripples[8];
uniform int u_rippleCount;
uniform float u_force;

void main() {
  vec2 uv = v_uv;

  if (u_rippleCount > 0) {
    vec2 offset = vec2(0.0);
    for (int i = 0; i < 8; i++) {
      if (i >= u_rippleCount) break;
      vec4 rip = u_ripples[i];
      vec2 d = uv - rip.xy;
      float dist = length(d);
      if (dist < rip.z && dist > 0.0001) {
        float t = 1.0 - dist / rip.z;
        float mag = t * t * (3.0 - 2.0 * t) * u_force * rip.w;
        offset += (d / dist) * mag;
      }
    }
    uv += offset;
  }

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(u_bgColor, 1.0);
    return;
  }

  vec2 gridUV = uv * u_gridSize;
  vec2 cellIndex = floor(gridUV);
  vec2 cellUV = fract(gridUV);

  vec2 dataUV = (cellIndex + 0.5) / u_gridSize;
  float rawGlyph = texture2D(u_glyphData, dataUV).r * 255.0;
  float glyphIdx = floor(rawGlyph + 0.5);

  if (glyphIdx < 0.5) {
    gl_FragColor = vec4(u_bgColor, 1.0);
    return;
  }

  // Exact physical pixel coordinates inside the cell (centered at 0,0)
  vec2 cellDim = u_resolution / u_gridSize;
  vec2 pixelOffset = (cellUV - 0.5) * cellDim;
  float dist = length(pixelOffset);

  float glyphAlpha = 0.0;

  if (u_isDots == 1) {
    float cellRadius = min(cellDim.x, cellDim.y) * 0.5;
    float r1 = max(1.1, cellRadius * 0.28);
    float r2 = max(1.8, cellRadius * 0.55);
    float r3 = max(2.6, cellRadius * 0.90);

    float targetRadius = 0.0;
    if (glyphIdx > 2.5) {
      targetRadius = r3;
    } else if (glyphIdx > 1.5) {
      targetRadius = r2;
    } else if (glyphIdx > 0.5) {
      targetRadius = r1;
    }
    glyphAlpha = 1.0 - smoothstep(targetRadius - 0.5, targetRadius + 0.5, dist);
  } else {
    // High-resolution cell-aligned Braille and glyph sampling
    float atlasU = (glyphIdx + clamp(cellUV.x, 0.0, 1.0)) / u_glyphCount;
    float atlasV = clamp(cellUV.y, 0.0, 1.0);
    glyphAlpha = texture2D(u_glyphAtlas, vec2(atlasU, atlasV)).a;
  }

  // Accurate RGB565 Color Unpacking
  vec3 charColor = u_textColor.rgb;
  float charAlpha = u_textColor.a;

  if (u_useNaturalColor == 1) {
    vec4 raw565 = texture2D(u_colorData, dataUV);
    float lowByte = raw565.r * 255.0;
    float highByte = raw565.a * 255.0;

    float r = floor(highByte / 8.0) / 31.0;
    float g = (mod(highByte, 8.0) * 8.0 + floor(lowByte / 32.0)) / 63.0;
    float b = mod(lowByte, 32.0) / 31.0;
    charColor = vec3(r, g, b);
    charAlpha = 1.0;
  }

  vec3 finalColor = mix(u_bgColor, charColor, glyphAlpha * charAlpha);
  gl_FragColor = vec4(finalColor, 1.0);
}
`

function createGlyphAtlas(glyphs: string) {
  const count = glyphs.length
  const cellW = 96
  const cellH = 160
  const canvas = document.createElement('canvas')
  canvas.width = cellW * count
  canvas.height = cellH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold 120px "Segoe UI Symbol", "Apple Symbols", "DejaVu Sans", monospace, sans-serif`

  for (let i = 0; i < count; i++) {
    if (glyphs[i] !== ' ') {
      ctx.fillText(glyphs[i], i * cellW + cellW / 2, cellH / 2)
    }
  }

  return canvas
}

function initWebGL(gl: WebGLRenderingContext, glyphs: string, cols: number, rows: number) {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  if (!vs) return null
  gl.shaderSource(vs, VS_SOURCE)
  gl.compileShader(vs)

  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  if (!fs) return null
  gl.shaderSource(fs, FS_SOURCE)
  gl.compileShader(fs)

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('WebGL program link error:', gl.getProgramInfoLog(program))
    return null
  }

  gl.useProgram(program)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

  // Fullscreen quad buffer
  const posBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  )

  const aPosition = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(aPosition)
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

  // Data Textures
  // 1. Glyph Data Texture (Unit 0)
  const glyphDataTex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, glyphDataTex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, cols, rows, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  // 2. Color Data Texture (Unit 1)
  const colorDataTex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, colorDataTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, cols, rows, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  // 3. Glyph Atlas Texture (Unit 2)
  const atlasCanvas = createGlyphAtlas(glyphs)
  const atlasTex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE2)
  gl.bindTexture(gl.TEXTURE_2D, atlasTex)
  if (atlasCanvas) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas)
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  // Set uniform locations
  gl.uniform1i(gl.getUniformLocation(program, 'u_glyphData'), 0)
  gl.uniform1i(gl.getUniformLocation(program, 'u_colorData'), 1)
  gl.uniform1i(gl.getUniformLocation(program, 'u_glyphAtlas'), 2)
  gl.uniform2f(gl.getUniformLocation(program, 'u_gridSize'), cols, rows)
  gl.uniform1f(gl.getUniformLocation(program, 'u_glyphCount'), glyphs.length)
  gl.uniform1i(gl.getUniformLocation(program, 'u_isDots'), glyphs === ' ·•●' ? 1 : 0)
  gl.uniform1f(gl.getUniformLocation(program, 'u_force'), ASCII_INTERACTION.force)

  return {
    program,
    glyphDataTex,
    colorDataTex,
    atlasTex,
    locations: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      bgColor: gl.getUniformLocation(program, 'u_bgColor'),
      textColor: gl.getUniformLocation(program, 'u_textColor'),
      useNaturalColor: gl.getUniformLocation(program, 'u_useNaturalColor'),
      ripples: gl.getUniformLocation(program, 'u_ripples'),
      rippleCount: gl.getUniformLocation(program, 'u_rippleCount'),
    },
  }
}

export function AsciiVideo({
  meta = defaultMeta,
  framesUrl = defaultFramesUrl,
  colorsUrl = defaultColorsUrl,
  charset,
  color = 'natural',
  backgroundColor = 'var(--color-bg)',
  fps,
  loop = true,
  typeLoop = false,
  playing = true,
  interactive = true,
  interaction = 'none',
  type = ASCII_INTERACTION.type,
  animation = 'none',
  animationDuration = 0.8,
  className,
}: AsciiVideoProps) {
  const uniqueId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const webglStateRef = useRef<ReturnType<typeof initWebGL> | null>(null)
  const frameRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const framesRef = useRef<Uint8Array | null>(null)
  const colorsDataRef = useRef<Uint16Array | null>(null)
  const startRef = useRef(0)
  const lastFrameRef = useRef(-1)
  const ripplesRef = useRef<
    { x: number; y: number; strength: number; anim: AnimationPlaybackControls | null }[]
  >([])
  const hoverRippleRef = useRef<{ x: number; y: number; strength: number; anim: AnimationPlaybackControls | null }>({
    x: 0,
    y: 0,
    strength: 0,
    anim: null,
  })
  const hoverAnimRef = useRef<AnimationPlaybackControls | null>(null)
  const physicsActiveRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { cols, rows, frameCount } = meta
  const playbackFps = fps ?? meta.fps
  const glyphs = charset && charset.length === meta.charset.length ? charset : meta.charset
  const frameSize = cols * rows
  const useNaturalColor = color === 'natural'

  const syncSize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return false

    const w = container.clientWidth
    const h = container.clientHeight
    if (w === 0 || h === 0) return false

    if (Math.abs(sizeRef.current.w - w) > 2 || Math.abs(sizeRef.current.h - h) > 2) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      if (!glRef.current) {
        const gl = canvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          preserveDrawingBuffer: false,
        })
        if (gl) {
          glRef.current = gl
          webglStateRef.current = initWebGL(gl, glyphs, cols, rows)
        }
      }

      if (glRef.current) {
        glRef.current.viewport(0, 0, canvas.width, canvas.height)
      }

      sizeRef.current = { w, h, dpr }
    }

    return true
  }, [cols, glyphs, rows])

  const draw = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current
      const frames = framesRef.current
      if (!canvas || !frames || !syncSize()) return

      const gl = glRef.current
      const state = webglStateRef.current
      if (!gl || !state) return

      const actualFrameCount = Math.floor(frames.length / frameSize)
      if (actualFrameCount <= 0) return

      const safeFrameIndex = ((frameIndex % actualFrameCount) + actualFrameCount) % actualFrameCount
      const offset = safeFrameIndex * frameSize
      const frameSlice = frames.subarray(offset, offset + frameSize)
      if (frameSlice.length < frameSize) return

      const colorsData = colorsDataRef.current

      gl.useProgram(state.program)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

      // Resolution uniform
      gl.uniform2f(state.locations.resolution, canvas.width, canvas.height)

      // Upload Glyph Index Texture (Texture unit 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, state.glyphDataTex)
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        cols,
        rows,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        frameSlice
      )

      // Upload Color Data Texture (Texture unit 1)
      if (useNaturalColor && colorsData) {
        const colorByteOffset = offset * 2
        const colorByteLength = frameSize * 2
        if (colorByteOffset + colorByteLength <= colorsData.buffer.byteLength) {
          gl.activeTexture(gl.TEXTURE1)
          gl.bindTexture(gl.TEXTURE_2D, state.colorDataTex)
          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            cols,
            rows,
            gl.LUMINANCE_ALPHA,
            gl.UNSIGNED_BYTE,
            new Uint8Array(colorsData.buffer, colorByteOffset, colorByteLength)
          )
        }
      }

      // Bind Glyph Atlas Texture (Texture unit 2)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, state.atlasTex)

      // Update Uniforms
      const bgRgba = parseCssColor(backgroundColor, '#0d0d0d')
      const textRgba = parseCssColor(color, '#f0f0f0')
      gl.uniform3f(state.locations.bgColor, bgRgba[0], bgRgba[1], bgRgba[2])
      gl.uniform4f(state.locations.textColor, textRgba[0], textRgba[1], textRgba[2], textRgba[3])
      gl.uniform1i(state.locations.useNaturalColor, useNaturalColor ? 1 : 0)

      // Ripples
      const activeRipples = ripplesRef.current.filter((r) => r.strength > 0.02)
      if (hoverRippleRef.current.strength > 0.02) {
        activeRipples.push(hoverRippleRef.current)
      }

      const rippleCount = Math.min(activeRipples.length, 8)
      gl.uniform1i(state.locations.rippleCount, rippleCount)

      if (rippleCount > 0) {
        const rippleData = new Float32Array(32)
        const { w, h } = sizeRef.current
        for (let i = 0; i < rippleCount; i++) {
          const r = activeRipples[i]
          rippleData[i * 4 + 0] = w > 0 ? r.x / w : 0.5
          rippleData[i * 4 + 1] = h > 0 ? r.y / h : 0.5
          rippleData[i * 4 + 2] = ASCII_INTERACTION.radius
          rippleData[i * 4 + 3] = r.strength
        }
        gl.uniform4fv(state.locations.ripples, rippleData)
      }

      // Single hardware draw call for entire 160x284 grid
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    [backgroundColor, color, cols, frameSize, rows, syncSize, useNaturalColor]
  )

  const pointFromEvent = (clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return null
    const { w, h } = sizeRef.current
    if (w === 0 || h === 0) return null
    const rect = container.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const leanOptions = (phase: 'out' | 'back') => {
    if (type === 'spring') {
      return phase === 'out' ? ASCII_INTERACTION.springOut : ASCII_INTERACTION.springBack
    }
    return phase === 'out'
      ? { duration: ASCII_INTERACTION.durationOut, ease: easeOut }
      : { duration: ASCII_INTERACTION.duration, ease: easeInOut }
  }

  const pulse = (clientX: number, clientY: number) => {
    if (!interactive) return
    const point = pointFromEvent(clientX, clientY)
    if (!point) return

    const ripple = { x: point.x, y: point.y, strength: 0, anim: null as AnimationPlaybackControls | null }
    const list = ripplesRef.current
    if (list.length >= 8) {
      list[0]?.anim?.stop()
      list.shift()
    }
    list.push(ripple)
    physicsActiveRef.current = true

    const playBack = () => {
      ripple.anim = animate(1, 0, {
        ...leanOptions('back'),
        onUpdate: (value) => {
          ripple.strength = value
        },
        onComplete: () => {
          ripple.strength = 0
          const index = ripplesRef.current.indexOf(ripple)
          if (index >= 0) ripplesRef.current.splice(index, 1)
        },
      })
    }

    ripple.anim = animate(0, 1, {
      ...leanOptions('out'),
      onUpdate: (value) => {
        ripple.strength = value
      },
      onComplete: playBack,
    })
  }

  const follow = (clientX: number, clientY: number) => {
    if (!interactive) return
    const point = pointFromEvent(clientX, clientY)
    if (!point) return
    hoverAnimRef.current?.stop()
    hoverRippleRef.current.x = point.x
    hoverRippleRef.current.y = point.y
    hoverRippleRef.current.strength = 1
    physicsActiveRef.current = true
  }

  const release = () => {
    if (hoverRippleRef.current.strength <= 0.02) return
    hoverAnimRef.current?.stop()
    hoverAnimRef.current = animate(hoverRippleRef.current.strength, 0, {
      ...leanOptions('back'),
      onUpdate: (value) => {
        hoverRippleRef.current.strength = value
      },
      onComplete: () => {
        hoverRippleRef.current.strength = 0
      },
    })
  }

  useEffect(() => {
    let cancelled = false
    setReady(false)

    const load = async () => {
      const framesResponse = await fetch(framesUrl)
      const framesBuffer = await framesResponse.arrayBuffer()
      if (cancelled) return
      framesRef.current = new Uint8Array(framesBuffer)

      if (useNaturalColor) {
        const colorsResponse = await fetch(colorsUrl)
        const colorsBuffer = await colorsResponse.arrayBuffer()
        if (cancelled) return
        colorsDataRef.current = new Uint16Array(colorsBuffer)
      }

      lastFrameRef.current = -1
      setReady(true)
    }

    load().catch(() => {
      if (!cancelled) setError('No se pudieron cargar los frames ASCII')
    })

    return () => {
      cancelled = true
    }
  }, [colorsUrl, framesUrl, useNaturalColor])

  useEffect(() => {
    if (!ready) return

    startRef.current = performance.now()
    lastFrameRef.current = -1
    const visibleRef = { current: true }
    let running = true

    const tick = (now: number) => {
      if (!running) return
      if (document.hidden || !visibleRef.current) {
        frameRef.current = null
        return
      }

      const elapsed = (now - startRef.current) / 1000
      const rawIndex = Math.floor(elapsed * playbackFps)
      let frameIndex = 0
      if (!loop) {
        frameIndex = Math.min(rawIndex, frameCount - 1)
      } else if (typeLoop) {
        frameIndex = pingPongIndex(rawIndex, frameCount)
      } else {
        frameIndex = rawIndex % frameCount
      }

      const frameChanged = playing && frameIndex !== lastFrameRef.current
      const rippleMoved =
        hoverRippleRef.current.strength > 0.02 ||
        ripplesRef.current.some((ripple) => ripple.strength > 0.02)
      physicsActiveRef.current = rippleMoved

      if (frameChanged || rippleMoved || lastFrameRef.current === -1) {
        lastFrameRef.current = frameIndex
        draw(frameIndex)
      }

      if (playing || physicsActiveRef.current) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
      }
    }

    const startLoop = () => {
      if (!running || frameRef.current != null) return
      frameRef.current = requestAnimationFrame(tick)
    }

    const stopLoop = () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.hidden) stopLoop()
      else startLoop()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) startLoop()
        else stopLoop()
      },
      { rootMargin: '80px' }
    )
    if (containerRef.current) observer.observe(containerRef.current)

    document.addEventListener('visibilitychange', onVisibility)
    startLoop()

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (Math.abs(sizeRef.current.w - width) > 2 || Math.abs(sizeRef.current.h - height) > 2) {
          sizeRef.current.w = 0
          lastFrameRef.current = -1
        }
      }
    })
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => {
      running = false
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      hoverAnimRef.current?.stop()
      for (const ripple of ripplesRef.current) ripple.anim?.stop()
      ripplesRef.current = []
      stopLoop()
    }
  }, [draw, frameCount, loop, playbackFps, playing, ready, typeLoop])

  return (
    <div
      ref={containerRef}
      className={cn(
        interaction === 'none' ? 'pointer-events-none' : 'pointer-events-auto',
        'z-0 select-none overflow-hidden',
        className
      )}
      style={{
        backgroundColor,
        animation: animation === 'fade' ? `asciiFade ${animationDuration}s ease-out both` : undefined,
      }}
      onPointerDown={interaction === 'click' ? (event) => pulse(event.clientX, event.clientY) : undefined}
      onPointerMove={interaction === 'hover' ? (event) => follow(event.clientX, event.clientY) : undefined}
      onPointerLeave={interaction === 'hover' ? release : undefined}
    >
      <canvas
        id={`ascii-video-${uniqueId}`}
        ref={canvasRef}
        className={cn(
          'block h-full w-full select-none',
          interaction === 'none' ? 'pointer-events-none cursor-default' : 'cursor-pointer'
        )}
        aria-label="Video convertido a ASCII"
        role="img"
      />
      {error && (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

