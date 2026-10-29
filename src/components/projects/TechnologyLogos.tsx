import { TECH_REGISTRY, normalizeTechKey } from '@/data/technologies'
import { motion, type MotionValue } from 'motion/react'
import useProjectReveal from './useProjectReveal'

function TechnologyLogo({ tech, index, count, progress }: { tech: string; index: number; count: number; progress: MotionValue<number> }) {
  const start = 0.72 + index / Math.max(1, count - 1) * 0.12
  const reveal = useProjectReveal(progress, start, start + 0.16)
  const info = TECH_REGISTRY[normalizeTechKey(tech)]
  return <motion.li style={reveal}>
    {info ? <a className="project-tech-logo" href={info.url} target="_blank" rel="noopener noreferrer" aria-label={info.name} title={info.name}>
      <span aria-hidden="true">{info.icon(info.color)}</span>
      <span className="project-tech-tooltip" aria-hidden="true">{info.name}</span>
    </a> : <span className="text-caption text-text-secondary">{tech}</span>}
  </motion.li>
}

export default function TechnologyLogos({ technologies, label, progress }: { technologies: string[]; label: string; progress: MotionValue<number> }) {
  return (
    <ul className="project-tech-logos" aria-label={label}>
      {technologies.map((tech, index) => <TechnologyLogo key={tech} tech={tech} index={index} count={technologies.length} progress={progress} />)}
    </ul>
  )
}
