import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useLenis } from 'lenis/react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { Container } from '@/components/Section';
import { useModal } from '@/components/ui/modal';
import './nav.css';

const links = [
  { href: '#projects', label: 'Proyectos' },
  { href: '#why-me', label: 'Acerca de' },
  { href: '#footer', label: 'Contacto' },
];

const menuLinks = [links[0], { href: '#skills', label: 'Habilidades' }, ...links.slice(1)];

const overlayVariants: Variants = { hidden: {}, visible: {}, exit: {} };

function MenuToggle({ open, reduced, onClick, hidden = false }: {
  open: boolean; reduced: boolean; onClick: () => void; hidden?: boolean;
}) {
  return <motion.button type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
    aria-expanded={open} aria-controls={open ? 'primary-menu' : undefined}
    className="group relative size-11 cursor-pointer lg:hidden"
    style={{ visibility: hidden ? 'hidden' : 'visible' }}
    initial={{ transform: 'rotate(0deg)', color: 'var(--color-text)' }}
    animate={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)', color: open ? 'var(--color-link)' : 'var(--color-text)' }}
    exit={{ transform: 'rotate(0deg)', color: 'var(--color-text)' }}
    transition={reduced ? { duration: 0 } : {
      transform: { type: 'spring', duration: 0.5, bounce: 0.2 },
      color: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
    }}
    onClick={onClick}>
    <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-current" />
    <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 bg-current" />
  </motion.button>;
}

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPresent, setMenuPresent] = useState(false);
  useEffect(() => { if (isOpen) setMenuPresent(true); }, [isOpen]);
  const [hidden, setHidden] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const lenis = useLenis();
  const reduced = useReducedMotion() ?? false;
  const { target, titleId, panelProps, overlayProps } = useModal({
    open: isOpen || menuPresent,
    onClose: () => setIsOpen(false),
  });

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setIsOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  // Accumulate travel in one direction so small touch corrections do not toggle navigation.
  useEffect(() => {
    let previous = window.scrollY;
    let travel = 0;
    let direction = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const current = Math.max(0, Math.min(window.scrollY, maximum));
      const delta = current - previous;
      previous = current;
      if (isOpen || navRef.current?.closest('[inert]')) {
        travel = 0;
        return;
      }
      const height = navRef.current?.offsetHeight ?? 70;
      if (current <= height) {
        setHidden(false);
        travel = 0;
        return;
      }
      if (navRef.current?.querySelector(':focus-visible')) {
        setHidden(false);
        travel = 0;
        return;
      }
      if (Math.abs(delta) < 0.5) return;
      const nextDirection = Math.sign(delta);
      travel = nextDirection === direction ? travel + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (direction < 0 && travel >= 48) setHidden(false);
      if (direction > 0 && current > height * 2 && travel >= 80) setHidden(true);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  // Navigate after the mobile menu releases its scroll lock.
  useEffect(() => {
    if (!destination || isOpen || menuPresent) return;
    const frame = window.requestAnimationFrame(() => {
      const section = document.querySelector<HTMLElement>(destination);
      if (section) {
        // The footer is sticky: its bounding box is not the end of the document.
        let top = destination === '#footer'
          ? Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
          : window.scrollY + section.getBoundingClientRect().top;
        if (destination === '#why-me') {
          top += Math.max(0, section.offsetHeight - window.innerHeight) * 0.94;
        }
        window.history.pushState(null, '', destination);
        if (lenis) lenis.scrollTo(top, { immediate: reduced, force: true });
        else window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
      }
      setDestination(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [destination, isOpen, menuPresent, lenis, reduced]);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setIsOpen(false);
    setDestination(href);
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 14, filter: reduced ? 'none' : 'blur(3px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduced ? 0 : 0.24, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, y: reduced ? 0 : 14, filter: reduced ? 'none' : 'blur(3px)', transition: { duration: reduced ? 0 : 0.24, ease: [0.23, 1, 0.32, 1] } },
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={false}
        animate={{ transform: hidden && !isOpen ? 'translateY(-100%)' : 'translateY(0%)' }}
        transition={reduced ? { duration: 0 } : {
          type: 'tween',
          duration: hidden && !isOpen ? 0.22 : 0.28,
          ease: [0.23, 1, 0.32, 1],
        }}
        onFocusCapture={event => {
          if (event.target.matches(':focus-visible')) setHidden(false);
        }}
        data-hidden={hidden && !isOpen} aria-label="Navegación principal" className="site-nav sticky top-0 shrink-0 z-40 flex h-nav-height w-full items-center px-5 sm:px-8 md:px-gutter border-b border-rule-default bg-bg">
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
                    onClick={event => navigate(event, link.href)}
                    className="font-display text-ui text-text transition-colors duration-200 hover:text-link"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <MenuToggle open={isOpen} reduced={reduced} hidden={isOpen || menuPresent} onClick={() => setIsOpen(true)} />
          </div>
        </Container>
      </motion.nav>
      {target && createPortal(<AnimatePresence onExitComplete={() => setMenuPresent(false)}>
        {isOpen && (
          <motion.div
            {...overlayProps}
            data-lenis-prevent="true"
            className="fixed inset-0 h-dvh w-full z-60 lg:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
          >
            <motion.div aria-hidden="true" className="absolute inset-0 bg-bg/95 backdrop-blur-xl"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: reduced ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] } }, exit: { opacity: 0, transition: { delay: reduced ? 0 : 0.41, duration: reduced ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] } } }} />
            <div {...panelProps} id="primary-menu" className="relative flex h-full w-full flex-col justify-center px-5 sm:px-8 outline-none">
            <h2 id={titleId} className="sr-only">Menú de navegación</h2>
            <div className="absolute inset-x-0 top-0 flex h-nav-height items-center px-5 sm:px-8 md:px-gutter">
              <Container className="flex justify-end">
                <MenuToggle open={isOpen} reduced={reduced} onClick={() => setIsOpen(value => !value)} />
              </Container>
            </div>
            <motion.ul className="mx-auto flex w-full max-w-page flex-col gap-6"
              variants={{ hidden: {}, visible: { transition: { delayChildren: reduced ? 0 : 0.08, staggerChildren: reduced ? 0 : 0.055 } }, exit: { transition: { staggerChildren: reduced ? 0 : 0.055, staggerDirection: -1 } } }}>
              {menuLinks.map((link) => (
                <motion.li key={link.href} variants={itemVariants} className="">
                  <motion.a
                    href={link.href}
                    onClick={event => navigate(event, link.href)}
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
