import { useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useSpring, type Variants } from 'motion/react'
import { skillCategories, type SkillCategory } from '../data/skills'
import AnimatedTitle from '@/components/AnimatedTitle'
import TechBadge from '@/components/TechBadge'

const panelVariants: Variants = {
    hidden: {
        height: 0,
        opacity: 0,
        transition: {
            height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
            opacity: { duration: 0.15 },
        },
    },
    visible: {
        height: 'auto',
        opacity: 1,
        transition: {
            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
            opacity: { duration: 0.25 },
            delayChildren: 0.06,
            staggerChildren: 0.04,
        },
    },
    exit: {
        height: 0,
        opacity: 0,
        transition: {
            height: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
            opacity: { duration: 0.12 },
        },
    },
}

const badgeItemVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.94 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 380, damping: 24 },
    },
    exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
}

function AccordionItem({
    category,
    isOpen,
    onToggle,
    reduced,
}: {
    category: SkillCategory
    isOpen: boolean
    onToggle: () => void
    reduced: boolean
}) {
    const itemRef = useRef<HTMLDivElement>(null)

    // useScroll dedicado: cada acordeón se activa en su ventana óptica precisa de entrada
    const { scrollYProgress: itemScroll } = useScroll({
        target: itemRef,
        offset: ['start 92%', 'start 58%'],
    })

    // Inercia elástica de resortes (Emil Kowalski / Apple): físico, orgánico y sin saltos bruscos
    const smoothItemScroll = useSpring(itemScroll, {
        stiffness: 170,
        damping: 26,
        mass: 0.8,
        restDelta: 0.001,
    })

    // Opacidad cinematográfica elegante: emerge gradualmente al aproximarse al centro visual
    const opacity = useTransform(smoothItemScroll, [0, 0.65], [reduced ? 1 : 0, 1])

    // Elevación vertical sutil: recorrido suave de 18px a 0 (reemplaza el salto tosco de 60px)
    const y = useTransform(smoothItemScroll, [0, 0.65], reduced ? [0, 0] : [18, 0])

    // Micro-escala desde 0.985 (nunca desde 0) para conferir peso y tridimensionalidad
    const scale = useTransform(smoothItemScroll, [0, 0.65], reduced ? [1, 1] : [0.985, 1])

    // Blur-fade óptico: la tipografía se enfoca nítidamente a medida que emerge
    const filter = useTransform(
        smoothItemScroll,
        [0, 0.55],
        reduced ? ['blur(0px)', 'blur(0px)'] : ['blur(6px)', 'blur(0px)']
    )

    return (
        <motion.div
            ref={itemRef}
            style={{
                opacity,
                y,
                scale,
                filter,
                willChange: 'transform, opacity, filter',
            }}
            className="group/item relative w-full will-change-transform"
        >
            {/* Botón Cabecera del Acordeón con Tokens Clamp Fluidos y respuesta táctil instantánea */}
            <motion.button
                type="button"
                onClick={onToggle}
                whileTap={{ scale: 0.995 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex w-full cursor-pointer items-center justify-between py-[clamp(14px,1.8vw,22px)] text-left select-none transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
            >
                {/* Título Fluido de Gran Formato: clamp(34px, 4.5vw, 64px) con tracking editorial */}
                <h3 className={`font-body text-[clamp(34px,4.5vw,64px)] font-medium leading-[1.08] tracking-[-0.015em] transition-colors duration-300 ${isOpen ? 'text-text' : 'text-text/90 group-hover/item:text-accent'
                    }`}>
                    {category.title}
                </h3>

                {/* Cruz geométrica minimalista (.service-plus) */}
                <div className="relative size-[clamp(16px,1.2vw,18px)] ml-4 shrink-0 self-center text-muted transition-colors duration-300 group-hover/item:text-text">
                    {/* Línea horizontal */}
                    <span className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-current" />
                    {/* Línea vertical que rota -90deg al abrirse */}
                    <motion.span
                        animate={{ rotate: isOpen ? -90 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-current origin-center"
                    />
                </div>
            </motion.button>

            {/* Contenido Expandible con Badges Tecnológicas Oficiales e Interactivas */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="overflow-hidden"
                    >
                        <div className="flex flex-wrap items-center gap-2 pt-[clamp(6px,0.8vw,12px)] pb-[clamp(20px,2.5vw,32px)] pl-0 sm:pl-1">
                            {category.skills.map((skill) => (
                                <motion.div
                                    key={skill}
                                    variants={reduced ? undefined : badgeItemVariants}
                                >
                                    <TechBadge
                                        tech={skill}
                                        className="px-3 py-1.5 text-xs sm:text-sm"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default function Skills() {
    const reduced = useReducedMotion() ?? false
    // Categoría activa (siempre una abierta o expandible)
    const [activeId, setActiveId] = useState<string>('frontend')

    const selectCategory = (id: string) => {
        setActiveId((prev) => (prev === id ? '' : id))
    }

    return (
        <section
            id="skills"
            className="flex min-h-svh w-full flex-col items-center justify-start overflow-x-clip px-5 sm:px-8 md:px-12 py-16 sm:py-20 md:py-24"
        >
            <div className="flex w-full flex-col gap-8 sm:gap-10">
                <AnimatedTitle animation="spring">
                    Habilidades
                </AnimatedTitle>

                {/* Lista de acordeones con respiro y separación entre secciones */}
                <div className="group/list flex w-full flex-col gap-y-4 sm:gap-y-6 md:gap-y-8">
                    {skillCategories.map((category) => (
                        <AccordionItem
                            key={category.id}
                            category={category}
                            isOpen={activeId === category.id}
                            onToggle={() => selectCategory(category.id)}
                            reduced={reduced}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}