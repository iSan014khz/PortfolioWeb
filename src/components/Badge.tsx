import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'motion/react'
import { cn } from '@/lib/cn'

export interface BadgeProps extends HTMLMotionProps<'span'> {
    reduced?: boolean
    index?: number
}

export default function Badge({
    children,
    className,
    reduced: customReduced,
    index = 0,
    ...props
}: BadgeProps) {
    const systemReduced = useReducedMotion() ?? false
    const reduced = customReduced ?? systemReduced

    const badgeVariants: Variants = {
        hidden: {
            opacity: 0,
            y: reduced ? 0 : 20,
            rotateX: reduced ? 0 : 180,
            // filter: reduced ? 'none' : 'blur(8px)',
            scale: reduced ? 1 : 0.85,
        },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            rotateX: 0,
            filter: 'blur(0px)',
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 95,
                damping: 15,
                mass: 0.8,
                delay: 0.04 + (i ?? 0) * 0.035,
            },
        }),
        exit: (i: number) => ({
            opacity: 0,
            y: reduced ? 0 : -8,
            rotateX: reduced ? 0 : -90,
            filter: 'blur(4px)',
            transition: {
                duration: 0.15,
                delay: (i ?? 0) * 0.02,
                ease: 'easeOut',
            },
        }),
        hover: {
            scale: reduced ? 1 : 1.05,
            filter: 'brightness(1.15)',
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 18,
            },
        },
        tap: {
            scale: reduced ? 1 : 0.95,
            skewY: 3,
            skewX: -3,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 12,
            },
        },
    }

    return (
        <motion.span
            custom={index}
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d', backfaceVisibility: 'visible' }}
            className={cn(
                'font-body inline-flex items-center w-fit bg-gradient-accent py-[clamp(4px,0.4vw,6px)] px-[clamp(12px,0.9vw,16px)] rounded-full text-[clamp(13px,0.85rem+0.25vw,15px)] leading-[1.214] font-normal text-text transition-colors duration-200 hover:text-text cursor-default shadow-pill text-shadow-subtle select-none will-change-transform',
                className
            )}
            {...props}
        >
            {children}
        </motion.span>
    )
}
