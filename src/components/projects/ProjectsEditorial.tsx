import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import ScrollReveal from '@/components/ui/scroll-reveal'
import type { Project } from '@/data/projects'
import { Container, Section } from '@/components/Section'
import TechnologyLogos from './TechnologyLogos'
import useProjectReveal from './useProjectReveal'
import './projects.css'
import { editorialProjects, projectPresentation } from './content'
import ProjectCase from './ProjectCase'
import type { ModalOrigin } from '@/components/ui/use-modal-axis-expansion'
import type { IsometricId } from './isometrics/IsometricProject'

const IsometricProject = lazy(() => import('./isometrics/IsometricProject'))

function ProjectEntry({ project, onOpen }: {
  project: Project
  onOpen: (project: Project, origin: ModalOrigin) => void
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
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 27, mass: 0.55 })
  const { scrollYProgress: entryProgress } = useScroll({ target: ref, offset: ['start 96%', 'start 76%'] })
  const lineProgress = useSpring(entryProgress, { stiffness: 170, damping: 26, mass: 0.8 })
  const lineTransform = useTransform(lineProgress, value => `scaleX(${reduced ? 1 : Math.max(0, Math.min(1, value))})`)
  const lineOpacity = useTransform(lineProgress, [0, 1], reduced ? [0, 1] : [1, 1])
  // One entrance playhead for the whole sticky composition, before its story starts.
  const { scrollYProgress: compositionEntry } = useScroll({ target: ref, offset: ['start 96%', 'start start'] })
  const entrance = useSpring(compositionEntry, { stiffness: 170, damping: 26, mass: 0.8 })
  const titleReveal = useProjectReveal(entrance, 0, 0.22)
  const dateReveal = useProjectReveal(entrance, 0.04, 0.26)
  const descriptionReveal = useProjectReveal(entrance, 0.12, 0.36)
  const artReveal = useProjectReveal(entrance, 0.25, 0.62)
  const caseReveal = useProjectReveal(entrance, 0.65, 0.88)
  const presentation = projectPresentation[project.id]


  return (
    <article
      ref={ref}
      aria-labelledby={`editorial-project-${project.id}`}
      className="project-scroll-track"
      data-project={project.id}
      data-reduced={reduced}
    >
      <div className="project-sticky-frame">
      <motion.span aria-hidden="true" className="project-divider" style={{ transform: lineTransform, opacity: lineOpacity }} />
      <header className="project-sticky-header">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <motion.h3 style={titleReveal} id={`editorial-project-${project.id}`} className="font-body project-sticky-title">
            {project.name}
          </motion.h3>
          <motion.p style={dateReveal} className="font-body text-caption text-text-secondary tabular-nums">{project.year}</motion.p>
        </div>
        <motion.p style={descriptionReveal} className="project-sticky-description max-w-reading font-body text-text-secondary text-pretty">
          {presentation?.summary ?? project.subtitle}
        </motion.p>
      </header>

      <motion.figure style={artReveal} className="project-sticky-art">
        {nearViewport && <Suspense fallback={null}><IsometricProject projectId={project.id as IsometricId} progress={progress} /></Suspense>}
      </motion.figure>

      <div className="project-sticky-footer flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <motion.button
          style={caseReveal}
          type="button"
          aria-label={`Ver caso de ${project.name}`}
          aria-haspopup="dialog"
          onClick={event => {
            const trigger = event.currentTarget
            const { left, top, width, height } = trigger.getBoundingClientRect()
            onOpen(project, { left, top, width, height, trigger })
          }}
          className="project-case-trigger"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </motion.button>
        <TechnologyLogos progress={entrance} technologies={project.stack} label={`Tecnologías de ${project.name}`} />
      </div>
      </div>
    </article>
  )
}

export default function ProjectsEditorial({ preview = false }: { preview?: boolean }) {
  const [selected, setSelected] = useState<{ project: Project; origin: ModalOrigin } | null>(null)
  const [caseOpen, setCaseOpen] = useState(false)

  const openCase = (project: Project, origin: ModalOrigin) => {
    setSelected({ project, origin })
    setCaseOpen(true)
  }

  return (
    <Section id="projects" className={preview ? 'projects-editorial projects-editorial-preview' : 'projects-editorial'}>
      <Container>
        <ScrollReveal as="h2" className="mb-8 font-contrast text-section font-normal tracking-editorial sm:mb-10">Proyectos</ScrollReveal>
        <div className="project-scroll-list">
          {editorialProjects.map(project => (
            <ProjectEntry key={project.id} project={project} onOpen={openCase} />
          ))}
        </div>
        {selected && <ProjectCase key={selected.project.id} project={selected.project} open={caseOpen} expandFrom={selected.origin} typography="editorial" onClose={() => setCaseOpen(false)} />}
      </Container>
    </Section>
  )
}
