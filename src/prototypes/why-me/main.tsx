import { StrictMode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import '../../index.css';
import '../../styles/tokens.css';
import './picker.css';
import './stage.css';
import Editorial from './Editorial';
import Convergencia from './Convergencia';
import Bisagra from './Bisagra';
import portrait from '../../assets/yo.jpg';

const variants = [Editorial, Convergencia, Bisagra];
const names = ['Editorial', 'Convergencia', 'Bisagra'];
const descriptions = ['Dos bloques, un revelado limpio.', 'De la expansión a la precisión.', 'Un giro desde la base de cada letra.'];

function Scene({ variant }: { variant: number }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (p) => setPercent(Math.round(p * 100)));
  const contentOpacity = useTransform(scrollYProgress, [0.83, 0.95], [0, 1]);
  const Variant = variants[variant];
  return <section className="lab-track" ref={section}>
    <div className="lab-stage">
      <header className="lab-header"><a href="/">← Portfolio</a><span>ESTUDIO DE MOVIMIENTO / 0{variant + 1}</span></header>
      <div className="lab-caption"><h1>{names[variant]}</h1><p>{descriptions[variant]}</p></div>
      <Variant progress={scrollYProgress} />
      <motion.div className="lab-destination" style={{ opacity: contentOpacity }}>
        <p>Nacido en México.<br /><strong>criado en el código.</strong></p>
        <img src={portrait} alt="Santiago Palma" />
      </motion.div>
      <aside className="lab-guide"><span>{variant === 1
        ? percent < 12 ? '01 / CONVERGENCIA' : percent < 34 ? '02 / CONVERGENCIA + ZOOM' : percent < 86 ? '03 / ACERCAMIENTO' : '04 / PRESENTACIÓN'
        : percent < 34 ? '01 / APARICIÓN' : percent < 50 ? '02 / LECTURA' : percent < 86 ? '03 / ACERCAMIENTO' : '04 / PRESENTACIÓN'}</span><span>{percent}%</span>
        <div className="lab-meter"><motion.div style={{ scaleX: scrollYProgress }} /></div>
        <p>Baja para revelar · Sube para deshacer<br />1–3 o ← → para comparar · R para reiniciar</p>
      </aside>
    </div>
  </section>;
}

function Playground() {
  const [current, setCurrent] = useState(() => {
    const n = Number(new URLSearchParams(location.search).get('v'));
    return Number.isInteger(n) && n >= 1 && n <= 3 ? n - 1 : 0;
  });
  const [replay, setReplay] = useState(0);
  const picker = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const choose = useCallback((n: number) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCurrent(n);
    setReplay((r) => r + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(n + 1));
    history.replaceState(null, '', url);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const num = Number(e.key);
      if (num >= 1 && num <= 3) choose(num - 1);
      else if (e.key === 'ArrowRight') { e.preventDefault(); choose((current + 1) % 3); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); choose((current + 2) % 3); }
      else if (e.key.toLowerCase() === 'r') choose(current);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [choose, current]);
  useLayoutEffect(() => {
    const move = () => {
      const selected = picker.current?.querySelector<HTMLElement>('[data-active]');
      if (selected && highlight.current) {
        highlight.current.style.width = `${selected.offsetWidth}px`;
        highlight.current.style.transform = `translateX(${selected.offsetLeft}px)`;
      }
    };
    move();
    window.addEventListener('resize', move);
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => picker.current?.setAttribute('data-ready', '')); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); window.removeEventListener('resize', move); };
  }, [current]);
  return <><Scene key={`${current}-${replay}`} variant={current} />
    <nav className="proto-picker" aria-label="Prototype variants" ref={picker}>
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {names.map((name, i) => <button key={name} className="proto-picker-item" data-active={i === current ? '' : undefined} aria-current={i === current ? 'true' : undefined} onClick={() => choose(i)}>{name}</button>)}
      <span className="proto-picker-divider" aria-hidden="true" />
      <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => choose(current)}>↻</button>
    </nav></>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Playground /></StrictMode>);
