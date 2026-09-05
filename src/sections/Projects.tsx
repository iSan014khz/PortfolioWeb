import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useReducedMotion, type MotionValue } from 'motion/react'
import { projects, type Project } from '../data/projects'
import AnimatedTitle from '@/components/AnimatedTitle'
import TechBadge from '@/components/TechBadge'
import { Modal } from '@/components/ui/modal'

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
    const rafId = requestAnimationFrame(updatePositions)
    const timeoutId = setTimeout(updatePositions, 150)
    const ro = new ResizeObserver(updatePositions)
    ro.observe(containerRef.current)
    window.addEventListener('resize', updatePositions)
    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timeoutId)
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
  const horizontalEndX = 18

  // Tronco vertical único continuo: remata centrado como una "T" invertida (⊥)
  const firstNodeY = positions[0]?.nodeY ?? 4
  const lastIndex = positions.length - 1
  const lastPos = positions[lastIndex]
  // Altura final vertical de la línea: restar 24 hace que termine de forma precisa al cierre del contenido
  const lastCurveStartY = Math.max(lastPos?.nodeY ?? 4, (lastPos?.actionY ?? 700) - 24)
  const totalTrunkDistance = Math.max(1, lastCurveStartY - firstNodeY)

  const trunkPath = `M 4,${firstNodeY} L 4,${lastCurveStartY}`
  const trunkProgress = useTransform(smoothProgress, [0, TRUNK_END_SCROLL], [0, 1], { clamp: true })
  const trunkOpacity = useTransform(smoothProgress, (t: number) => (t > 0.001 ? 1 : 0))

  // Remate horizontal simétrico centrado en "T" invertida (⊥) sobre el eje x=4
  // crossbarHalfWidth controla qué tan larga es la línea horizontal (6 = 12px de ancho total)
  const crossbarHalfWidth = 6
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

      {/* Lista de Proyectos con animaciones fluidas con useScroll (Motion) */}
      <div className="space-y-14 sm:space-y-16">
        {projects.map((project, index) => {
          const nodeTouch = curveData[index]?.nodeTouchProgress ?? 0

          return (
            <ProjectItem
              key={project.id}
              project={project}
              index={index}
              nodeTouch={nodeTouch}
              smoothProgress={smoothProgress}
              onOpen={onOpen}
              setNodeRef={(el) => {
                nodeRefs.current[index] = el
              }}
              setActionRef={(el) => {
                actionRefs.current[index] = el
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

interface ProjectItemProps {
  project: Project
  index: number
  nodeTouch: number
  smoothProgress: MotionValue<number>
  onOpen: (p: Project) => void
  setNodeRef: (el: HTMLDivElement | null) => void
  setActionRef: (el: HTMLDivElement | null) => void
}

function ProjectBadgeItem({
  tech,
  index,
  smoothItemScroll,
  shouldReduceMotion,
}: {
  tech: string
  index: number
  smoothItemScroll: MotionValue<number>
  shouldReduceMotion: boolean
}) {
  // Cascada escalonada orgánica: cada badge emerge secuencialmente con ritmo y presencia física
  const start = 0.28 + index * 0.04
  const end = Math.min(0.95, start + 0.26)

  const badgeOpacity = useTransform(smoothItemScroll, [start, end], [0, 1])
  const badgeY = useTransform(
    smoothItemScroll,
    [start, end],
    shouldReduceMotion ? [0, 0] : [12, 0]
  )
  const badgeScale = useTransform(
    smoothItemScroll,
    [start, end],
    shouldReduceMotion ? [1, 1] : [0.92, 1]
  )
  const badgeFilter = useTransform(
    smoothItemScroll,
    [start, end],
    shouldReduceMotion ? ['blur(0px)', 'blur(0px)'] : ['blur(4px)', 'blur(0px)']
  )

  return (
    <motion.div
      style={{
        opacity: badgeOpacity,
        y: badgeY,
        scale: badgeScale,
        filter: badgeFilter,
        willChange: 'transform, opacity, filter',
      }}
    >
      <TechBadge tech={tech} />
    </motion.div>
  )
}

function ProjectItem({
  project,
  index: _index,
  nodeTouch,
  smoothProgress,
  onOpen,
  setNodeRef,
  setActionRef,
}: ProjectItemProps) {
  const itemRef = useRef<HTMLElement>(null)
  const shouldReduceMotion = useReducedMotion() ?? false

  // useScroll exclusivo para la aparición elegante de este proyecto
  // Offset calibrado al 40% del viewport: empieza sutilmente al entrar en visión y culmina en el centro óptico
  const { scrollYProgress: itemScroll } = useScroll({
    target: itemRef,
    offset: ['start 92%', 'start 52%'],
  })

  // Física elástica de resortes Emil Kowalski: inercia suave, fluida e ininterrumpible
  const smoothItemScroll = useSpring(itemScroll, {
    stiffness: 170,
    damping: 26,
    mass: 0.8,
    restDelta: 0.001,
  })

  // Cohesión de transformaciones GPU: sin saltos bruscos
  const cardOpacity = useTransform(smoothItemScroll, [0, 0.4], [0, 1])

  // Título monumental: blur-fade progresivo y micro-escala desde 0.97 (nunca desde 0)
  const titleOpacity = useTransform(smoothItemScroll, [0.05, 0.48], [0, 1])
  const titleY = useTransform(
    smoothItemScroll,
    [0.05, 0.48],
    shouldReduceMotion ? [0, 0] : [22, 0]
  )
  const titleScale = useTransform(
    smoothItemScroll,
    [0.05, 0.48],
    shouldReduceMotion ? [1, 1] : [0.97, 1]
  )
  const titleFilter = useTransform(
    smoothItemScroll,
    [0.05, 0.48],
    shouldReduceMotion ? ['blur(0px)', 'blur(0px)'] : ['blur(8px)', 'blur(0px)']
  )

  // Frase síntesis de impacto editorial: cadencia armonizada
  const subtitleOpacity = useTransform(smoothItemScroll, [0.18, 0.62], [0, 1])
  const subtitleY = useTransform(
    smoothItemScroll,
    [0.18, 0.62],
    shouldReduceMotion ? [0, 0] : [16, 0]
  )
  const subtitleScale = useTransform(
    smoothItemScroll,
    [0.18, 0.62],
    shouldReduceMotion ? [1, 1] : [0.985, 1]
  )
  const subtitleFilter = useTransform(
    smoothItemScroll,
    [0.18, 0.62],
    shouldReduceMotion ? ['blur(0px)', 'blur(0px)'] : ['blur(6px)', 'blur(0px)']
  )

  // Contenedor de badges: entrada fluida
  const badgesContainerOpacity = useTransform(smoothItemScroll, [0.26, 0.72], [0, 1])
  const badgesContainerY = useTransform(
    smoothItemScroll,
    [0.26, 0.72],
    shouldReduceMotion ? [0, 0] : [10, 0]
  )

  return (
    <motion.article
      ref={itemRef}
      style={{
        opacity: cardOpacity,
      }}
      className="group relative select-none"
    >
      {/* Cabecera del Proyecto: Responsiva */}
      <div className="flex items-start">
        {/* Columna 1: Nodo del árbol */}
        <div className="flex items-center gap-3">
          <div
            ref={setNodeRef}
            className="flex size-2 mt-2.5 shrink-0 items-center justify-center"
          >
            <TimelineNodeIndicator
              smoothProgress={smoothProgress}
              nodeTouch={nodeTouch}
            />
          </div>
        </div>

        {/* Columna 2: Título monumental (Se abre exclusivamente al tocar el título) */}
        <div className="pl-5 sm:pl-0">
          <motion.div
            style={{
              opacity: titleOpacity,
              y: titleY,
              scale: titleScale,
              filter: titleFilter,
              willChange: 'transform, opacity, filter',
            }}
            role="button"
            tabIndex={0}
            aria-label={`Abrir detalles del proyecto ${project.name}`}
            onClick={() => onOpen(project)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(project)
              }
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 25 }}
            className="group/title inline-block cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
          >
            <h3 className="font-body text-[clamp(26px,3.5vw,48px)] font-medium leading-[1.1] tracking-editorial text-text transition-colors duration-200 group-hover/title:text-accent">
              {project.name}
            </h3>
          </motion.div>
        </div>
      </div>

      {/* Contenido alineado con la columna del título */}
      <div className="relative pl-5 sm:pl-[80px] md:pl-[110px] pt-2">
        {/* Frase síntesis de impacto editorial (Se abre exclusivamente al tocar la descripción) */}
        <motion.p
          style={{
            opacity: subtitleOpacity,
            y: subtitleY,
            scale: subtitleScale,
            filter: subtitleFilter,
            willChange: 'transform, opacity, filter',
          }}
          role="button"
          tabIndex={0}
          aria-label={`Abrir detalles del proyecto ${project.name}`}
          onClick={() => onOpen(project)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(project)
            }
          }}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 420, damping: 25 }}
          className="max-w-2xl font-body text-base sm:text-lg leading-relaxed text-muted/85 font-normal text-pretty cursor-pointer transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
        >
          {project.subtitle}
        </motion.p>

        {/* Stack tecnológico con badges y enlaces externos */}
        <motion.div
          style={{
            opacity: badgesContainerOpacity,
            y: badgesContainerY,
            willChange: 'transform, opacity',
          }}
          className="mt-3.5 flex flex-wrap items-center gap-1.5"
        >
          {project.stack.map((tech, techIdx) => (
            <ProjectBadgeItem
              key={tech}
              tech={tech}
              index={techIdx}
              smoothItemScroll={smoothItemScroll}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </motion.div>

        {/* Anclaje para cálculo vertical de altura de la sección */}
        <div
          ref={setActionRef}
          className="mt-6 flex items-center gap-2 font-body text-sm sm:text-base text-muted"
        />
      </div>
    </motion.article>
  )
}

function TimelineNodeIndicator({
  smoothProgress,
  nodeTouch,
}: {
  smoothProgress: MotionValue<number>
  nodeTouch: number
}) {
  const shouldReduceMotion = useReducedMotion() ?? false

  // Pulso táctil / ignición eléctrica cuando la línea vertical del scroll toca el nodo
  const touchStart = Math.max(0, nodeTouch - 0.015)
  const touchPeak = nodeTouch + 0.012
  const touchEnd = nodeTouch + 0.035

  const nodeScale = useTransform(
    smoothProgress,
    [touchStart, touchPeak, touchEnd],
    shouldReduceMotion ? [1, 1, 1] : [0.75, 1.25, 1]
  )
  const nodeBorder = useTransform(
    smoothProgress,
    [touchStart, touchEnd],
    ['rgba(255,255,255,0.25)', 'var(--color-accent, #c8ff00)']
  )
  const nodeBg = useTransform(
    smoothProgress,
    [touchStart, touchEnd],
    ['rgba(0,0,0,0)', 'var(--color-accent, #c8ff00)']
  )
  const nodeShadow = useTransform(
    smoothProgress,
    [touchStart, touchPeak, touchEnd],
    [
      '0 0 0px transparent',
      '0 0 12px var(--color-accent, #c8ff00)',
      '0 0 4px var(--color-accent, #c8ff00)',
    ]
  )

  return (
    <motion.span
      style={{
        scale: nodeScale,
        borderColor: nodeBorder,
        backgroundColor: nodeBg,
        boxShadow: nodeShadow,
      }}
      whileHover={{ scale: 1.45, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      className="size-2 rounded-[2px] border transition-colors duration-200 group-hover:border-accent group-hover:bg-accent group-hover:shadow-[0_0_8px_var(--color-accent)] cursor-pointer"
      aria-hidden="true"
    />
  )
}

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(0)

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project)
    setOpenAccordionIndex(0)
  }

  const toggleAccordion = (index: number) => {
    setOpenAccordionIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section
      id="projects"
      className="flex min-h-svh w-full flex-col items-center justify-start px-5 sm:px-8 md:px-12 py-16 sm:py-20 md:py-24"
    >
      <div className="flex w-full flex-col gap-6">
        {/* Encabezado Editorial */}
        <div className="flex items-center justify-between pb-4">
          <AnimatedTitle animation="ease">Proyectos</AnimatedTitle>
        </div>

        {/* Árbol Editorial con SVG Maestro Único (Tronco continuo y curvas activas por scroll) */}
        <EditorialTreeSection
          projects={projects}
          onOpen={handleOpenProject}
        />
      </div>

      {/* Modal coherente con la tipografía y patrones del portafolio */}
      <Modal
        open={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        title={null}
        headerImage={selectedProject?.imageUrl}
        maxWidth={760}
      >
        {selectedProject && (
          <div className="mx-auto w-full max-w-[700px] space-y-10 py-2 pb-10 sm:pb-14 font-body text-text">
            {/* 1. Header (Limpio, directo y con margen seguro para botón de cierre) */}
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

              {/* Subtítulo / Lead */}
              <p className="max-w-[62ch] text-base sm:text-lg leading-relaxed text-muted font-normal font-body text-pretty">
                {selectedProject.description}
              </p>

              {/* Botón de acción directo */}
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

            {/* 2. Qué se construyó / Módulos (Acordeón con accesibilidad y diseño refinado) */}
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
                    const contentId = `accordion-panel-${i}`

                    return (
                      <div key={i} className="group relative w-full will-change-transform border-b border-muted/10 pb-6 sm:pb-8 last:border-b-0 last:pb-0">
                        {/* Botón Cabecera del Acordeón */}
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

                        {/* Contenido Expandible */}
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
                                  height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                                  opacity: { duration: 0.25, delay: 0.05 },
                                },
                              }}
                              exit={{
                                height: 0,
                                opacity: 0,
                                transition: {
                                  height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                                  opacity: { duration: 0.15 },
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

            {/* 3. Desafíos y Aprendizajes clave (Jerarquía unificada con font-contrast) */}
            {((selectedProject.challenges && selectedProject.challenges.length > 0) ||
              (selectedProject.learnings && selectedProject.learnings.length > 0)) && (
                <div className="grid gap-10 sm:grid-cols-2 pt-6 border-t border-muted/20 font-body">
                  {/* Desafíos clave */}
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

                  {/* Aprendizajes clave */}
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

            {/* 4. Tecnologías y herramientas (Jerarquía unificada con font-contrast) */}
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
