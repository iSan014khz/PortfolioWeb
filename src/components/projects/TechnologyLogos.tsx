import { TECH_REGISTRY, normalizeTechKey } from '@/data/technologies'

export default function TechnologyLogos({ technologies, label }: { technologies: string[]; label: string }) {
  return (
    <ul className="project-tech-logos" aria-label={label}>
      {technologies.map(tech => {
        const info = TECH_REGISTRY[normalizeTechKey(tech)]
        if (!info) return <li key={tech} className="text-caption text-text-secondary">{tech}</li>
        return (
          <li key={tech}>
            <a className="project-tech-logo" href={info.url} target="_blank" rel="noopener noreferrer" aria-label={info.name} title={info.name}>
              <span aria-hidden="true">{info.icon(info.color)}</span>
              <span className="project-tech-tooltip" aria-hidden="true">{info.name}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
