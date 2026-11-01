import { StrictMode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import '../../styles/tokens.css';
import './picker.css';
import './stage.css';
import Original from './Original';
import Origen from './Origen';
import Barrido from './Barrido';
import Relieve from './Relieve';


const variants = [Original, Origen, Barrido, Relieve];
const names = ['Actual', 'Origen', 'Barrido', 'Relieve'];
const descriptions = ['La sección actual, copiada sin ajustes.', 'Tu retrato aparece dentro de México antes de abrirse.', 'Una diagonal conecta la foto con el texto.', 'El retrato se endereza y las letras se asientan.'];

function Scene({ variant }: { variant: number }) {
  const Variant = variants[variant];
  const showPortrait = () => {
    const section = document.getElementById('why-me');
    if (!section) return;
    const start = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: start + (section.offsetHeight - window.innerHeight) * 0.44, behavior: 'instant' });
  };
  return <>
    <header className="polish-header"><a href="/">← Portfolio</a><span>{names[variant]} · {descriptions[variant]}</span><button onClick={showPortrait}>Ir a México / foto ↓</button></header>
    <Variant />
    <div className="polish-help">Scroll para avanzar o retroceder · 1–4 para comparar · R reinicia</div>
  </>;
}

function Playground() {
  const [current, setCurrent] = useState(() => {
    const n = Number(new URLSearchParams(location.search).get('v'));
    return Number.isInteger(n) && n >= 1 && n <= 4 ? n - 1 : 0;
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
      if (num >= 1 && num <= 4) choose(num - 1);
      else if (e.key === 'ArrowRight') { e.preventDefault(); choose((current + 1) % 4); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); choose((current + 3) % 4); }
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
