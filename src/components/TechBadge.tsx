import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { TECH_REGISTRY, normalizeTechKey, type TechInfo } from '@/data/technologies'

export type { TechInfo }

export interface TechBadgeProps {
  tech: string
  className?: string
  showIcon?: boolean
  href?: string
}

export default function TechBadge({ tech, className, showIcon = true, href }: TechBadgeProps) {
  const reduced = useReducedMotion() ?? false
  const key = normalizeTechKey(tech)
  const info = TECH_REGISTRY[key]

  const displayName = info?.name ?? tech
  const brandColor = info?.color ?? '#A3A3A3'
  const targetUrl = href ?? info?.url ?? `https://www.google.com/search?q=${encodeURIComponent(displayName + ' official documentation')}`

  return (
    <motion.a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      whileHover={reduced ? undefined : { scale: 1.05, y: -1 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      title={`Visitar web oficial de ${displayName}`}
      className={cn(
        'group/badge inline-flex items-center gap-1.5 rounded-tag border border-rule-default bg-surface px-2.5 py-1 text-caption font-mono font-medium text-text-secondary select-none transition-colors duration-200 hover:border-link/50 hover:bg-surface-hover hover:text-text cursor-pointer',
        className
      )}
    >
      {showIcon && info && info.icon(brandColor)}
      {!info && showIcon && (
        <span
          className="size-1.5 rounded-full bg-accent/80 shrink-0"
          aria-hidden="true"
        />
      )}
      <span className="leading-tight transition-colors duration-200 group-hover/badge:text-text">{displayName}</span>
    </motion.a>
  )
}
