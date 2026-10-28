import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Project } from '@/data/projects'
import { Modal } from '@/components/ui/modal'
import TechBadge from '@/components/TechBadge'
import { projectPresentation } from './content'
import './case-typography.css'

export type CaseTypography = 'current' | 'editorial' | 'direct' | 'visual'

// Summaries only reorganize facts from src/data/projects.ts; no measured results are claimed.
const context: Record<string, { problem: string; result: string }> = {
  ixtli: {
    problem: 'Los equipos y licencias de los POS tradicionales suponen una inversión para los pequeños negocios. Administrar varias sucursales también exige reunir su información en un solo lugar.',
    result: 'El objetivo es reunir punto de venta, inventario y supervisión multi-sucursal en una aplicación web, con recomendaciones para reducir mermas y optimizar gastos. El proyecto sigue en desarrollo.',
  },
  bohorquez: {
    problem: 'Una empresa de construcción y remodelación en Toronto necesitaba presentar sus servicios y guiar a clientes residenciales y corporativos hacia la solicitud de una cotización.',
    result: 'Una landing page con identidad visual sobria, microinteracciones y un recorrido claro hacia los canales de contacto y solicitud de presupuesto.',
  },
  'ixtli-data': {
    problem: 'Para decidir qué vender en Mercado Libre, hace falta comparar productos equivalentes, entender la demanda y encontrar precios y descuentos que conserven el margen.',
    result: 'Un análisis personalizado del mercado y sus competidores, con segmentación por precio, estimaciones de demanda y diagnósticos visuales acompañados de guías prácticas para tomar decisiones comerciales.',
  },
}

// Only section titles change. Leads, detail subtitles and factual descriptions stay intact.
const sectionTitles: Record<string, { problem: string; result: string; work: string }> = {
  ixtli: {
    problem: 'Gestionar varios negocios con más claridad',
    result: 'Una aplicación para reunir la operación',
    work: 'Lo que estoy desarrollando',
  },
  bohorquez: {
    problem: 'Un sitio pensado para recibir cotizaciones',
    result: 'Un recorrido claro hacia el contacto',
    work: 'Las decisiones detrás del sitio',
  },
  'ixtli-data': {
    problem: 'Antes de elegir qué vender',
    result: 'Información para decidir con más criterio',
    work: 'Del mercado al diagnóstico',
  },
}

export default function ProjectCase({ project, onClose, typography = 'current', previewControls }: {
  project: Project
  onClose: () => void
  typography?: CaseTypography
  previewControls?: ReactNode
}) {
  const presentation = projectPresentation[project.id]
  const copy = context[project.id]
  const titles = sectionTitles[project.id]
  const yearParts = project.year.split(/\s+[—–-]\s+/)
  const roleParts = presentation?.role.split(/[·•|]/).map(part => part.trim()) ?? []
  const articleRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (typography !== 'current') articleRef.current?.parentElement?.parentElement?.scrollTo({ top: 0 })
  }, [typography, project.id])
  return (
    <Modal open onClose={onClose} title={project.name} description={<span className="case-type-meta"><span className="case-type-year">{yearParts.map(part => <span key={part}>{part}</span>)}</span><span className="case-type-role">{roleParts.map(part => <span key={part}>{part}</span>)}</span></span>} maxWidth={800} maxHeight="min(92dvh, 960px)" className={`project-case-modal case-type-${typography}`} showScrollProgress={false} footer={previewControls}>
      <article ref={articleRef} className="project-case font-body">
        <header className="project-case-intro">
          <p className="project-case-lead">{presentation?.summary ?? project.subtitle}</p>
          {project.link && <a className="project-case-site" href={project.link} target="_blank" rel="noopener noreferrer">Ver sitio <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg></a>}
        </header>
        <figure className="project-case-image">
          <img src={project.imageUrl} alt={`Captura de ${project.name}`} width={presentation?.width} height={presentation?.height} />
        </figure>
        <section className="project-case-section">
          <h3>{titles?.problem ?? 'El punto de partida'}</h3>
          <p>{copy?.problem ?? project.description}</p>
        </section>
        <section className="project-case-section">
          <h3>{titles?.result ?? 'La solución'}</h3>
          <p>{copy?.result ?? project.description}</p>
        </section>
        <section className="project-case-section">
          <h3>{titles?.work ?? project.detailsTitle ?? 'Cómo lo desarrollé'}</h3>
          <ul className="project-case-decisions">
            {project.details.map(detail => {
              const split = detail.indexOf(':')
              return <li key={detail}><h4>{split < 0 ? detail : detail.slice(0, split)}</h4>{split >= 0 && <p>{detail.slice(split + 1).trim()}</p>}</li>
            })}
          </ul>
        </section>
        <section className="project-case-section">
          <h3>Tecnologías del proyecto</h3>
          <ul className="project-case-badges" aria-label={`Tecnologías de ${project.name}`}>
            {project.stack.map(tech => <li key={tech}><TechBadge tech={tech} /></li>)}
          </ul>
        </section>
      </article>
    </Modal>
  )
}
