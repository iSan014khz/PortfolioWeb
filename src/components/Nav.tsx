import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';

const links = [
  { href: '#projects', label: 'Proyectos' },
  { href: '#about', label: 'Acerca de' },
  { href: '#contact', label: 'Contacto' },
];

const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.32, 0.72, 0, 1],
      when: 'afterChildren',
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.18,
      ease: [0.23, 1, 0.32, 1],
      when: 'beforeChildren',
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.32, 0.72, 0, 1],
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: reduced ? 0 : 14,
      filter: reduced ? 'none' : 'blur(3px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 420,
        damping: 28,
        mass: 0.65,
        filter: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
      },
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -8,
      filter: reduced ? 'none' : 'blur(2px)',
      transition: {
        duration: 0.12,
        ease: [0.32, 0.72, 0, 1],
      },
    },
  };

  return (
    <>
      <nav className="relative z-50 flex justify-between items-center w-full py-[4vw] px-[6vw] border-b border-muted bg-bg">
        <span className="w-[50%] text-xl font-body text-text">Santiago Palma</span>
        <div className="flex w-[50%] justify-end">
          <motion.button
            type="button"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            className="group relative size-5 z-50 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, mass: 1 }}
          >
            <span
              className={`absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 transition-colors duration-200 ${isOpen ? "bg-accent" : "bg-text group-hover:bg-accent"
                }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 transition-colors duration-200 ${isOpen ? "bg-accent" : "bg-text group-hover:bg-accent"
                }`}
            />
          </motion.button>
        </div>
      </nav>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 h-dvh w-full bg-bg/95 backdrop-blur-xl z-40 flex flex-col justify-center px-[8vw]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
          >
            <motion.ul className="flex flex-col gap-6">
              {links.map((link) => (
                <motion.li key={link.href} variants={itemVariants} className="">
                  <motion.a
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block text-5xl md:text-6xl font-display text-text transition-colors duration-200 hover:text-accent select-none"
                  >
                    {link.label}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
