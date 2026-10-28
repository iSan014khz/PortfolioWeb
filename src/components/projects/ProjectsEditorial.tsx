import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useLenis } from 'lenis/react'
import type { Project } from '@/data/projects'
import { Container, Section } from '@/components/Section'
import TechnologyLogos from './TechnologyLogos'
import './projects.css'
import { editorialProjects, projectPresentation } from './content'
import ProjectCase from './ProjectCase'
import type { IsometricId } from './isometrics/IsometricProject'

const IsometricProject = lazy(() => import('./isometrics/IsometricProject'))

function ProjectEntry({ project, onOpen }: {
  project: Project
  onOpen: (project: Project) => void
}) {
  const ref = useRef<HTMLElement>(null)
  const [nearViewport, setNearViewport] = useState(false)
  useEffect(() => {
    const target = ref.current
    if (!target) return
    if (!('IntersectionObserver' in window)) { setNearViewport(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearViewport(true); observer.disconnect() }
    }, { rootMargin: '400px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])
  const reduced = useReducedMotion() ?? false
  const lenis = useLenis()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 27, mass: 0.55 })
  const presentation = projectPresentation[project.id]
  const replay = () => {
    if (!ref.current) return
    if (lenis) lenis.scrollTo(ref.current, { immediate: reduced, duration: 0.85 })
    else ref.current.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' })
  }

  return (
    <article
      ref={ref}
      aria-labelledby={`editorial-project-${project.id}`}
      className="project-scroll-track"
      data-project={project.id}
      data-reduced={reduced}
    >
      <div className="project-sticky-frame">
      <header className="project-sticky-header">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 id={`editorial-project-${project.id}`} className="font-body project-sticky-title">
            {project.name}
          </h3>
          <span className="font-body text-caption text-text-secondary tabular-nums">{project.year}</span>
        </div>
        <p className="project-sticky-description max-w-reading font-body text-text-secondary text-pretty">
          {presentation?.summary ?? project.subtitle}
        </p>
      </header>

      <figure className="project-sticky-art">
        {nearViewport && <Suspense fallback={null}><IsometricProject projectId={project.id as IsometricId} progress={progress} onReplay={replay} /></Suspense>}
      </figure>

      <div className="project-sticky-footer flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <button
          type="button"
          aria-label={`Ver caso de ${project.name}`}
          aria-haspopup="dialog"
          onClick={() => onOpen(project)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-body text-ui text-text underline decoration-rule-strong underline-offset-4 transition-colors duration-150 hover:text-link hover:decoration-link"
        >
          Ver caso
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </button>
        <TechnologyLogos technologies={project.stack} label={`Tecnologías de ${project.name}`} />
      </div>
      </div>
    </article>
  )
}

export default function ProjectsEditorial({ preview = false }: { preview?: boolean }) {
  const [selected, setSelected] = useState<Project | null>(null)

  return (
    <Section id="projects" className={preview ? 'projects-editorial projects-editorial-preview' : 'projects-editorial'}>
      <Container>
        <h2 className="mb-8 font-contrast text-section font-normal tracking-editorial sm:mb-10">Proyectos</h2>
        <div className="project-scroll-list">
          {editorialProjects.map(project => (
            <ProjectEntry key={project.id} project={project} onOpen={setSelected} />
          ))}
        </div>
        {selected && <ProjectCase key={selected.id} project={selected} typography="editorial" onClose={() => setSelected(null)} />}
      </Container>
    </Section>
  )
}
