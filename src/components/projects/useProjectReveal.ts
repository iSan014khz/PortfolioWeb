import { useReducedMotion, useTransform, type MotionValue } from 'motion/react'

export default function useProjectReveal(progress: MotionValue<number>, start: number, end: number) {
  const reduced = useReducedMotion()
  const opacity = useTransform(progress, [start, end], [0, 1])
  const transform = useTransform(opacity, value => `translateY(${reduced ? 0 : 18 * (1 - value)}px)`)
  const visibility = useTransform(opacity, value => value <= 0 ? 'hidden' as const : 'visible' as const)
  return { opacity, transform, visibility }
}
