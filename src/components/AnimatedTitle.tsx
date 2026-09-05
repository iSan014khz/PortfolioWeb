import { motion, type Transition } from 'motion/react'
import React from 'react'

export interface AnimatedTitleProps {
  children: React.ReactNode
  animation?: 'spring' | 'ease'
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div'
  once?: boolean
}

const transitions: Record<'spring' | 'ease', (delay: number) => Transition> = {
  ease: (delay) => ({
    y: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
    opacity: { duration: 0.6, delay, ease: 'easeOut' },
    filter: { duration: 0.6, delay, ease: 'easeOut' },
    skewY: { duration: 0.6, delay, ease: 'easeOut' },
  }),
  spring: (delay) => ({
    y: { type: 'spring', stiffness: 100, damping: 14, mass: 0.8, delay },
    opacity: { duration: 0.4, delay, ease: 'easeOut' },
    filter: { duration: 0.4, delay, ease: 'easeOut' },
    skewY: { duration: 0.4, delay, ease: 'easeOut' },
  }),
}

export default function AnimatedTitle({
  children,
  animation = 'spring',
  className = '',
  delay = 0.1,
  as: Component = 'h2',
  once = true,
}: AnimatedTitleProps) {
  const transition = transitions[animation](delay)

  return (
    <Component className={`self-start font-contrast text-section font-semibold tracking-editorial text-text overflow-hidden ${className}`}>
      <motion.span
        className="block leading-editorial py-1"
        initial={{ y: '100%', opacity: 0, filter: 'blur(4px)', skewY: '15deg' }}
        whileInView={{ y: '0%', opacity: 1, filter: 'blur(0px)', skewY: '0deg' }}
        transition={transition}
        viewport={{ once, margin: '-20px' }}
      >
        {children}
      </motion.span>
    </Component>
  )
}
