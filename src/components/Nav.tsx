import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { Container } from '@/components/Section';
import { useModal } from '@/components/ui/modal';

const links = [
  { href: '#projects', label: 'Proyectos' },
  { href: '#about', label: 'Acerca de' },
  { href: '#footer', label: 'Contacto' },
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
  const { target, titleId, panelProps, overlayProps } = useModal({
    open: isOpen,
    onClose: () => setIsOpen(false),
  });

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setIsOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

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
      <nav aria-label="Navegación principal" className="relative z-40 flex h-nav-height w-full items-center px-5 sm:px-8 md:px-gutter border-b border-rule-default bg-bg">
        <Container className="flex items-center justify-between">
          <span className="w-[50%] text-xl lg:text-2xl font-body text-text">Santiago Palma</span>
          <div className="flex w-[50%] items-center justify-end">
            {/* Desde lg hay sitio de sobra para los enlaces en la barra. Comparten fuente, tamano
                y el mismo hover a `accent` que el overlay, para que se lean como el mismo sistema
                y no como otra navegacion distinta. */}
            <ul className="hidden lg:flex items-center gap-10">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-display text-ui text-text transition-colors duration-200 hover:text-link"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <motion.button
              type="button"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isOpen}
              aria-controls={isOpen ? 'primary-menu' : undefined}
              className="group relative size-11 cursor-pointer lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
              animate={{ rotate: reduced ? 0 : isOpen ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, mass: 1 }}
            >
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-3 h-5 w-0.5 -translate-x-1/2 transition-colors duration-200 ${isOpen ? "bg-link" : "bg-text group-hover:bg-link"
                  }`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-3 top-1/2 h-0.5 w-5 -translate-y-1/2 transition-colors duration-200 ${isOpen ? "bg-link" : "bg-text group-hover:bg-link"
                  }`}
              />
            </motion.button>
          </div>
        </Container>
      </nav>
      {target && createPortal(<AnimatePresence>
        {isOpen && (
          <motion.div
            {...overlayProps}
            data-lenis-prevent="true"
            className="fixed inset-0 h-dvh w-full bg-bg/95 backdrop-blur-xl z-60 lg:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
          >
            <div {...panelProps} id="primary-menu" className="relative flex h-full w-full flex-col justify-center px-5 sm:px-8 outline-none">
            <h2 id={titleId} className="sr-only">Menú de navegación</h2>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar menú" className="absolute right-5 top-[22px] grid size-11 cursor-pointer place-items-center text-text hover:text-link sm:right-8">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m3 3 14 14M17 3 3 17" /></svg>
            </button>
            <motion.ul className="mx-auto flex w-full max-w-page flex-col gap-6">
              {links.map((link) => (
                <motion.li key={link.href} variants={itemVariants} className="">
                  <motion.a
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                    className="inline-block text-5xl md:text-6xl font-display text-text transition-colors duration-200 hover:text-link select-none"
                  >
                    {link.label}
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>, target)}
    </>
  );
}
