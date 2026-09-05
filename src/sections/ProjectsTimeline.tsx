import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { projects, type Project } from '@/data/projects'
import { Modal } from '@/components/ui/modal'
import TechBadge from '@/components/TechBadge'

interface EditorialTreeProps {
  projects: Project[]
  onOpen: (p: Project) => void
}

const TRUNK_END_SCROLL = 0.86 // El tronco vertical finaliza en la última curva al 86% del scroll

/* function _BranchCurveItem({
  pathData,
  smoothProgress,
  touchProgress,
  duration = 0.08,
}: {
  pathData: string
  smoothProgress: MotionValue<number>
  touchProgress: number
  duration?: number
}) {
  const branchPathLength = useTransform(smoothProgress, (t: number) => {
    if (t <= touchProgress) return 0
    if (t >= touchProgress + duration) return 1
    return (t - touchProgress) / duration
  })
  const branchOpacity = useTransform(smoothProgress, (t: number) => (t > touchProgress ? 1 : 0))

  return (
    <g>
      <motion.path
        d={pathData}
        stroke="var(--color-accent, #c8ff00)"
        strokeWidth="1"
        strokeLinecap="round"
        style={{
          pathLength: branchPathLength,
          opacity: branchOpacity,
        }}
      />
    </g>
  )
} */

function EditorialTreeSection({ projects, onOpen }: EditorialTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const actionRefs = useRef<(HTMLDivElement | null)[]>([])
  const [positions, setPositions] = useState<{ nodeY: number; actionY: number }[]>([
    { nodeY: 4, actionY: 160 },
    { nodeY: 220, actionY: 380 },
    { nodeY: 440, actionY: 600 },
  ])
  const [containerHeight, setContainerHeight] = useState(0)

  // Medición dinámica ultra-precisa de las posiciones relativas de cada nodo y botón
  useEffect(() => {
    if (!containerRef.current) return
    const updatePositions = () => {
      if (!containerRef.current) return
      const cRect = containerRef.current.getBoundingClientRect()
      setContainerHeight(cRect.height)
      const pts = projects.map((_, i) => {
        const nodeEl = nodeRefs.current[i]
        const actionEl = actionRefs.current[i]
        const nodeY = nodeEl ? nodeEl.getBoundingClientRect().top - cRect.top + 4 : i * 220 + 4
        const actionY = actionEl
          ? actionEl.getBoundingClientRect().top - cRect.top + 10
          : i * 220 + 160
        return { nodeY, actionY }
      })
      setPositions(pts)
    }

    updatePositions()
    const ro = new ResizeObserver(updatePositions)
    ro.observe(containerRef.current)
    window.addEventListener('resize', updatePositions)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updatePositions)
    }
  }, [projects])

  // Único useScroll que orquesta el crecimiento continuo a lo largo de toda la sección
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 65%'],
  })

  // Física elástica fluida
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    restDelta: 0.001,
  })

  // Constantes geométricas del árbol
  const curveRadius = 14
  const horizontalEndX = 20

  // Tronco vertical único continuo: termina EXACTAMENTE donde empieza la última curva
  const firstNodeY = positions[0]?.nodeY ?? 4
  const lastIndex = positions.length - 1
  const lastPos = positions[lastIndex]
  const lastCurveStartY = Math.max(lastPos?.nodeY ?? 4, (lastPos?.actionY ?? 700) - curveRadius)
  const totalTrunkDistance = Math.max(1, lastCurveStartY - firstNodeY)

  const trunkPath = `M 4,${firstNodeY} L 4,${lastCurveStartY}`
  const trunkProgress = useTransform(smoothProgress, [0, TRUNK_END_SCROLL], [0, 1], { clamp: true })
  const trunkOpacity = useTransform(smoothProgress, (t: number) => (t > 0.001 ? 1 : 0))

  // Remate horizontal simétrico centrado en "T" invertida (⊥) sobre el eje x=4
  const crossbarHalfWidth = 10
  const crossbarStartScroll = TRUNK_END_SCROLL // Se muestra estrictamente después de que la línea principal llega a su base
  const crossbarEndScroll = Math.min(0.92, TRUNK_END_SCROLL + 0.035) // Despliegue ágil y fluido hacia ambos lados
  const crossbarProgress = useTransform(
    smoothProgress,
    [crossbarStartScroll, crossbarEndScroll],
    [0, 1],
    { clamp: true }
  )
  const crossbarOpacity = useTransform(
    smoothProgress,
    (t: number) => (t >= crossbarStartScroll ? 1 : 0)
  )

  // Cálculos matemáticos exactos del instante en que la punta de la línea toca cada curva y nodo
  const curveData = positions.map((p) => {
    const curveStartY = Math.max(p.nodeY, p.actionY - curveRadius)
    const touchProgress = Math.max(
      0,
      Math.min(TRUNK_END_SCROLL, ((curveStartY - firstNodeY) / totalTrunkDistance) * TRUNK_END_SCROLL)
    )
    const nodeTouchProgress = Math.max(
      0,
      Math.min(TRUNK_END_SCROLL, ((p.nodeY - firstNodeY) / totalTrunkDistance) * TRUNK_END_SCROLL)
    )
    const path =
      horizontalEndX > 4 + curveRadius
        ? `M 4,${curveStartY} Q 4,${p.actionY} ${4 + curveRadius},${p.actionY} L ${horizontalEndX},${p.actionY}`
        : `M 4,${curveStartY} Q 4,${p.actionY} ${horizontalEndX},${p.actionY}`
    return { path, touchProgress, nodeTouchProgress }
  })

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-3xl py-6">
      {/* ========================================================= */}
      {/* SVG MAESTRO ÚNICO: Tronco continuo vertical + Remate en "T" invertida */}
      {/* ========================================================= */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-12 overflow-visible fill-none"
        style={{
          height: containerHeight ? `${containerHeight}px` : '100%',
        }}
      >
        {/* Tronco vertical activo que desciende con el scroll */}
        <motion.path
          d={trunkPath}
          stroke="var(--color-accent, #c8ff00)"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            pathLength: trunkProgress,
            opacity: trunkOpacity,
          }}
        />

        {/* Remate horizontal centrado como una "T" invertida (⊥): despliegue simétrico desde x=4 hacia ambos lados */}
        <motion.path
          d={`M 4,${lastCurveStartY} L ${4 + crossbarHalfWidth},${lastCurveStartY}`}
          stroke="var(--color-accent, #c8ff00)"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            pathLength: crossbarProgress,
            opacity: crossbarOpacity,
          }}
        />
        <motion.path
          d={`M 4,${lastCurveStartY} L ${4 - crossbarHalfWidth},${lastCurveStartY}`}
          stroke="var(--color-accent, #c8ff00)"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            pathLength: crossbarProgress,
            opacity: crossbarOpacity,
          }}
        />

        {/* 3. Ramas curvas: Nacen con precisión matemática solo cuando la línea vertical las toca */}
        {/* {curveData.map((data, i) => (
          <BranchCurveItem
            key={`curve-${i}`}
            pathData={data.path}
            smoothProgress={smoothProgress}
            touchProgress={data.touchProgress}
            duration={0.08}
          />
        ))} */}
      </svg>

      {/* Lista de Proyectos */}
      <div className="space-y-14 sm:space-y-16">
        {projects.map((project, index) => {
          const nodeTouch = curveData[index]?.nodeTouchProgress ?? 0

          return (
            <article
              key={project.id}
              onClick={() => onOpen(project)}
              className="group relative cursor-pointer select-none"
            >
              {/* Cabecera del Proyecto: Responsiva (Columna en móvil, 2 Columnas en Desktop) */}
              <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[80px_1fr] md:grid-cols-[110px_1fr] sm:items-baseline sm:gap-0">
                {/* Columna 1: Nodo del árbol + Año */}
                <div className="flex items-center gap-3">
                  <div
                    ref={(el) => {
                      nodeRefs.current[index] = el
                    }}
                    className="flex size-2 shrink-0 items-center justify-center"
                  >
                    <TimelineNodeIndicator
                      smoothProgress={smoothProgress}
                      nodeTouch={nodeTouch}
                    />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted/80 tabular-nums">
                    {project.year}
                  </span>
                </div>

                {/* Columna 2: Título monumental */}
                <div className="pl-5 sm:pl-0">
                  <h3 className="font-body text-[clamp(26px,3.5vw,48px)] font-medium leading-[1.1] tracking-editorial text-text transition-colors duration-200 group-hover:text-accent">
                    {project.name}
                  </h3>
                </div>
              </div>

              {/* Contenido alineado con la columna del título */}
              <div className="relative pl-5 sm:pl-[80px] md:pl-[110px] pt-2">
                {/* Frase síntesis de impacto editorial */}
                <p className="max-w-2xl font-body text-base sm:text-lg leading-relaxed text-muted/90 font-normal text-pretty transition-colors duration-200 group-hover:text-text/90">
                  {project.subtitle}
                </p>

                {/* Stack tecnológico con badges de iconos SVG oficiales */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  {project.stack.map((tech) => (
                    <TechBadge key={tech} tech={tech} />
                  ))}
                </div>

                {/* Acción de cierre conectada a la curva del árbol */}
                <div
                  ref={(el) => {
                    actionRefs.current[index] = el
                  }}
                  className="mt-6 flex items-center gap-2 font-body text-sm sm:text-base text-muted transition-colors duration-200 group-hover:text-text"
                >
                  <span className="underline decoration-white/20 underline-offset-4 transition-colors duration-200 group-hover:text-accent group-hover:decoration-accent font-medium">
                    Explorar caso de estudio
                  </span>
                  <span className="font-mono text-xs transition-transform duration-200 ease-out group-hover:translate-x-1 text-muted group-hover:text-accent">
                    →
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function TimelineNodeIndicator({
  smoothProgress,
  nodeTouch,
}: {
  smoothProgress: MotionValue<number>
  nodeTouch: number
}) {
  const nodeScale = useTransform(
    smoothProgress,
    [Math.max(0, nodeTouch - 0.02), nodeTouch + 0.04],
    [0.85, 1.1]
  )
  const nodeBorder = useTransform(
    smoothProgress,
    [Math.max(0, nodeTouch - 0.02), nodeTouch + 0.04],
    ['rgba(255,255,255,0.3)', 'var(--color-accent, #c8ff00)']
  )
  const nodeBg = useTransform(
    smoothProgress,
    [Math.max(0, nodeTouch - 0.01), nodeTouch + 0.04],
    ['rgba(0,0,0,0)', 'var(--color-accent, #c8ff00)']
  )
  const nodeShadow = useTransform(
    smoothProgress,
    [Math.max(0, nodeTouch - 0.01), nodeTouch + 0.04],
    ['0 0 0px transparent', '0 0 8px var(--color-accent, #c8ff00)']
  )

  return (
    <motion.span
      style={{
        scale: nodeScale,
        borderColor: nodeBorder,
        backgroundColor: nodeBg,
        boxShadow: nodeShadow,
      }}
      className="size-2 border transition-colors duration-200 group-hover:border-accent group-hover:bg-accent group-hover:shadow-[0_0_8px_var(--color-accent)]"
      aria-hidden="true"
    />
  )
}

export default function ProjectsTimeline() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null)

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project)
    setOpenAccordionIndex(null)
  }

  const toggleAccordion = (index: number) => {
    setOpenAccordionIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section id="projects-editorial" className="relative w-full border-b border-muted bg-bg px-5 py-12 sm:px-8 sm:py-16 md:px-12">
      {/* Encabezado Editorial */}
      <div className="mx-auto max-w-4xl pb-10 sm:pb-14">
        <div className="flex items-center gap-2 pb-3">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            Archivo de Trabajo
          </span>
        </div>
        <h2 className="font-contrast text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-text leading-none">
          Proyectos
        </h2>
        <p className="mt-3 max-w-xl font-body text-sm sm:text-base text-muted leading-relaxed">
          Una selección de productos web, plataformas y herramientas con foco en ingeniería de software, arquitectura limpia y diseño interactivo.
        </p>
      </div>

      {/* Lista Estilo Árbol Editorial con SVG Maestro Único */}
      <EditorialTreeSection
        projects={projects}
        onOpen={handleOpenProject}
      />

      {/* Modal interactivo de detalle de proyecto */}
      <Modal
        open={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        title={null}
        headerImage={selectedProject?.imageUrl}
        maxWidth={760}
      >
        {selectedProject && (
          <div className="mx-auto w-full max-w-[700px] space-y-10 py-2 pb-10 sm:pb-14 font-body text-text">
            {/* Header del modal */}
            <header className="space-y-4 pr-10 sm:pr-12">
              <div className="space-y-1.5">
                <h1 className="font-body text-3xl sm:text-4xl font-semibold tracking-tight text-text text-pretty">
                  {selectedProject.name}
                </h1>

                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-muted font-body">
                  <span>Frontend & Diseño</span>
                  <span className="text-muted/40" aria-hidden="true">·</span>
                  <span className="text-muted font-body tabular-nums">{selectedProject.year}</span>
                </p>
              </div>

              <p className="max-w-[62ch] text-base sm:text-lg leading-relaxed text-muted font-normal font-body text-pretty">
                {selectedProject.description}
              </p>

              {selectedProject.link && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={selectedProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-muted/25 bg-muted/[0.06] px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted transition-colors duration-200 hover:border-text hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent font-body"
                  >
                    <span>Site</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M15 3h6v6" />
                      <path d="M10 14L21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </a>
                </div>
              )}
            </header>

            {/* Módulos construidos en acordeón */}
            {selectedProject.details && selectedProject.details.length > 0 && (
              <section className="space-y-6 font-body pt-6 border-t border-muted/20">
                <div className="pb-1">
                  <span className="font-contrast text-2xl sm:text-3xl text-text block">
                    {selectedProject.detailsTitle || 'Qué se construyó'}
                  </span>
                </div>

                <div className="flex w-full flex-col items-start justify-center gap-6 sm:gap-8">
                  {selectedProject.details.map((detail, i) => {
                    const [itemTitle, ...rest] = detail.includes(':')
                      ? detail.split(':')
                      : [detail, '']
                    const itemDesc = rest.join(':').trim()
                    const isOpen = openAccordionIndex === i
                    const contentId = `timeline-accordion-panel-${i}`

                    return (
                      <div key={i} className="group relative w-full will-change-transform border-b border-muted/10 pb-6 sm:pb-8 last:border-b-0 last:pb-0">
                        <button
                          type="button"
                          onClick={() => toggleAccordion(i)}
                          aria-expanded={isOpen}
                          aria-controls={contentId}
                          className="flex w-full cursor-pointer items-center justify-between text-left transition-colors duration-200 select-none gap-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                        >
                          <h3 className="font-body text-xl sm:text-2xl leading-snug text-text transition-colors duration-200 group-hover:text-accent font-medium text-pretty">
                            {itemTitle}
                          </h3>

                          <div className="flex items-center justify-center gap-4 shrink-0" aria-hidden="true">
                            <motion.span
                              animate={{ rotate: isOpen ? 45 : 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 15, mass: 1 }}
                              className={`font-body text-3xl text-shadow-pill leading-none inline-block transition-colors duration-200 ${isOpen
                                ? 'bg-gradient-accent bg-clip-text text-transparent'
                                : 'text-muted group-hover:text-accent'
                                }`}
                            >
                              +
                            </motion.span>
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && itemDesc && (
                            <motion.div
                              id={contentId}
                              role="region"
                              aria-label={itemTitle}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{
                                height: 'auto',
                                opacity: 1,
                                transition: {
                                  height: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
                                  opacity: { duration: 0.2, delay: 0.04 },
                                },
                              }}
                              exit={{
                                height: 0,
                                opacity: 0,
                                transition: {
                                  height: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
                                  opacity: { duration: 0.12 },
                                },
                              }}
                              className="overflow-hidden origin-bottom"
                            >
                              <div className="pt-3">
                                <p className="font-body text-sm sm:text-base leading-relaxed text-muted font-normal text-pretty">
                                  {itemDesc}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Desafíos y Aprendizajes */}
            {((selectedProject.challenges && selectedProject.challenges.length > 0) ||
              (selectedProject.learnings && selectedProject.learnings.length > 0)) && (
                <div className="grid gap-10 sm:grid-cols-2 pt-6 border-t border-muted/20 font-body">
                  {selectedProject.challenges && selectedProject.challenges.length > 0 && (
                    <div className="space-y-4">
                      <span className="font-contrast text-2xl sm:text-3xl text-text block">
                        Desafíos clave
                      </span>
                      <ul className="space-y-3">
                        {selectedProject.challenges.map((challenge, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm sm:text-base text-muted leading-relaxed font-body text-pretty"
                          >
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/70" aria-hidden="true" />
                            <span>{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedProject.learnings && selectedProject.learnings.length > 0 && (
                    <div className="space-y-4">
                      <span className="font-contrast text-2xl sm:text-3xl text-text block">
                        Aprendizajes clave
                      </span>
                      <ul className="space-y-3">
                        {selectedProject.learnings.map((learning, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm sm:text-base text-muted leading-relaxed font-body text-pretty"
                          >
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/70" aria-hidden="true" />
                            <span>{learning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            {/* Stack */}
            {selectedProject.stack && selectedProject.stack.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-muted/20 font-body">
                <span className="font-contrast text-2xl sm:text-3xl text-text block">
                  Tecnologías
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedProject.stack.map((tech) => (
                    <TechBadge key={tech} tech={tech} className="text-xs px-2.5 py-1" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
