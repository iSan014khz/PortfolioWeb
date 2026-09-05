import { motion } from 'motion/react'
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
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      title={`Visitar web oficial de ${displayName}`}
      className={cn(
        'group/badge inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-mono font-medium text-muted/90 select-none backdrop-blur-xs transition-colors duration-200 hover:border-accent/40 hover:bg-white/[0.07] hover:text-text cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
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
