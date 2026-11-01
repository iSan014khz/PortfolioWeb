import { useId, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

// Exploración aislada del SVG original: misma fuente, medición nativa y foco en la última o.
// OriginalSvgTextZoom.tsx conserva una copia de la versión aprobada como referencia.
const title = '¿Por qué yo?';
type Direction = 'editorial' | 'convergencia' | 'bisagra';
type Glyph = { char: string; x: number; width: number; index: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - Math.pow(1 - n, 3);

function Letter({ glyph, progress, direction, reduced }: {
  glyph: Glyph; progress: MotionValue<number>; direction: Direction; reduced: boolean;
}) {
  const { char, x, width, index } = glyph;
  const start = direction === 'editorial' ? (index < 8 ? 0.025 : 0.065) : 0.02 + index * 0.009;
  const entry = useTransform(progress, (p) => ease(clamp((p - start) / 0.22)));
  const transform = useTransform(entry, (t) => {
    if (reduced) return 'translate(0px, 0px)';
    const rest = 1 - t;
    if (direction === 'editorial') return `translateY(${120 * rest}px)`;
    if (direction === 'convergencia') {
      return `translate(${(x - 500) * 0.65 * rest}px, ${-18 * rest}px) scale(${1 + 0.22 * rest})`;
    }
    return `translateY(${35 * rest}px) rotate(${-75 * rest}deg)`;
  });
  const opacity = useTransform(entry, [0, 0.6, 1], [0, 1, 1]);
  return <motion.text x={x} y="110" dominantBaseline="central" className="font-contrast fill-text" fontSize="95"
    style={{ transform, opacity, transformOrigin: `${x + width / 2}px 155px` }}>{char}</motion.text>;
}

export default function SvgScrollTitle({ progress, direction }: { progress: MotionValue<number>; direction: Direction }) {
  const reduced = useReducedMotion() ?? false;
  const measurement = useRef<SVGTextElement>(null);
  const clipId = useId().replace(/:/g, '');
  const [glyphs, setGlyphs] = useState<Glyph[]>([]);
  const [focus, setFocus] = useState({ x: 660, y: 110 });
  useLayoutEffect(() => {
    let disposed = false;
    const measure = () => {
      if (disposed || !measurement.current) return;
      const el = measurement.current;
      setGlyphs(Array.from(title).map((char, index) => {
        const box = el.getExtentOfChar(index);
        return { char, index, x: el.getStartPositionOfChar(index).x, width: box.width };
      }));
      const box = el.getExtentOfChar(title.lastIndexOf('o'));
      setFocus({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    };
    measure();
    document.fonts.ready.then(measure);
    return () => { disposed = true; };
  }, []);
  const transform = useTransform(progress, (p) => {
    if (reduced) return 'translate(0px, 0px)';
    // En Convergencia, el acercamiento toma el relevo mientras aún se reúnen los glifos.
    const zoomStart = direction === 'convergencia' ? 0.12 : 0.5;
    const t = clamp((p - zoomStart) / (0.86 - zoomStart));
    const smooth = t * t * (3 - 2 * t);
    const scale = Math.exp(Math.log(100) * smooth);
    return `translate(${(500 - focus.x) * smooth}px, ${(110 - focus.y) * smooth}px) scale(${scale})`;
  });
  const opacity = useTransform(progress, [0.76, 0.88], [1, 0]);
  return <motion.svg viewBox="0 0 1000 220" role="img" aria-label={title} className="lab-title" style={{ opacity }}>
    <defs><clipPath id={clipId}><rect x="-2000" y="-200" width="5000" height="365" /></clipPath></defs>
    <text ref={measurement} x="500" y="110" textAnchor="middle" dominantBaseline="central" className="font-contrast" fontSize="95" opacity="0" aria-hidden="true">{title}</text>
    <motion.g style={{ transform, transformOrigin: `${focus.x}px ${focus.y}px` }} aria-hidden="true">
      <g clipPath={direction === 'editorial' && !reduced ? `url(#${clipId})` : undefined}>
        {glyphs.map((glyph) => <Letter key={glyph.index} glyph={glyph} progress={progress} direction={direction} reduced={reduced} />)}
      </g>
    </motion.g>
  </motion.svg>;
}
