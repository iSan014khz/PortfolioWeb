"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export interface ScrambleInProps {
  text: string
  scrambleSpeed?: number
  scrambledLetterCount?: number
  characters?: string
  className?: string
  scrambledClassName?: string
  autoStart?: boolean
  onStart?: () => void
  onComplete?: () => void
}

export interface ScrambleInHandle {
  start: () => void
  reset: () => void
}

export const ScrambleIn = forwardRef<ScrambleInHandle, ScrambleInProps>(
  (
    {
      text,
      scrambleSpeed = 35,
      scrambledLetterCount = 4,
      characters = "ABCDEFGHIJKLMNO PQRSTUVWXYZ abcdefghijklmno pqrstuvwxyz !@#$%^&*()_+",
      className = "",
      scrambledClassName = "text-accent font-mono opacity-80",
      autoStart = true,
      onStart,
      onComplete,
    },
    ref
  ) => {
    const [revealedCount, setRevealedCount] = useState(autoStart ? 0 : 0)
    const [scramblePart, setScramblePart] = useState("")
    const isRunningRef = useRef(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const stop = useCallback(() => {
      isRunningRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }, [])

    const start = useCallback(() => {
      stop()
      isRunningRef.current = true
      setRevealedCount(0)
      setScramblePart("")
      onStart?.()

      let currentVisible = 0
      let currentScrambleOffset = 0

      const tick = () => {
        if (!isRunningRef.current) return

        if (currentVisible < text.length) {
          currentVisible++
          setRevealedCount(currentVisible)

          const remainingSpace = Math.max(0, text.length - currentVisible)
          const count = Math.min(remainingSpace, scrambledLetterCount)

          let scrambled = ""
          for (let i = 0; i < count; i++) {
            scrambled += characters[Math.floor(Math.random() * characters.length)]
          }
          setScramblePart(scrambled)

          timerRef.current = setTimeout(tick, scrambleSpeed)
        } else if (currentScrambleOffset < scrambledLetterCount) {
          currentScrambleOffset++
          const count = Math.max(0, scrambledLetterCount - currentScrambleOffset)

          let scrambled = ""
          for (let i = 0; i < count; i++) {
            scrambled += characters[Math.floor(Math.random() * characters.length)]
          }
          setScramblePart(scrambled)

          timerRef.current = setTimeout(tick, scrambleSpeed)
        } else {
          setScramblePart("")
          isRunningRef.current = false
          onComplete?.()
        }
      }

      timerRef.current = setTimeout(tick, scrambleSpeed)
    }, [characters, onComplete, onStart, scrambleSpeed, scrambledLetterCount, stop, text])

    const reset = useCallback(() => {
      stop()
      setRevealedCount(0)
      setScramblePart("")
    }, [stop])

    useImperativeHandle(ref, () => ({
      start,
      reset,
    }))

    useEffect(() => {
      if (autoStart) {
        start()
      }
      return () => stop()
    }, [autoStart, start, stop])

    const revealedText = text.slice(0, revealedCount)

    return (
      <span className="inline-block whitespace-pre-wrap select-none">
        <span className="sr-only">{text}</span>
        <span className={className}>{revealedText}</span>
        {scramblePart && <span className={scrambledClassName}>{scramblePart}</span>}
      </span>
    )
  }
)

ScrambleIn.displayName = "ScrambleIn"
export default ScrambleIn
