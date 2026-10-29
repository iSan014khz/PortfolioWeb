import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react'

/** A reversible reveal measured against an untransformed text box. */
export default function ScrollReveal({ as: Tag = 'h2', children, className, id }: {
  as?: 'h2' | 'h3' | 'p'; children: ReactNode; className?: string; id?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 96%', 'start 76%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 170, damping: 26, mass: 0.8 })
  const opacity = useTransform(progress, [0, 1], [0, 1])
  const transform = useTransform(progress, value => `translateY(${reduced ? 0 : 18 * (1 - Math.max(0, Math.min(1, value)))}px)`)
  return <Tag ref={ref} className={className} id={id}>
    <motion.span className="block" style={{ opacity, transform }}>{children}</motion.span>
  </Tag>
}
