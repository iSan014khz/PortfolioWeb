import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, type ReactNode, type ReactElement } from 'react';
import { useReducedMotion, type MotionValue } from 'motion/react';

// Adaptación del efecto Scramble In de Fancy Components:
// https://www.fancycomponents.dev/docs/components/text/scramble-in
// Sin temporizadores: la misma posición de scroll produce siempre el mismo estado.
const characters = 'abcdefghijklmnopqrstuvwxyz!<>_+*/';
const clamp = (n: number) => Math.max(0, Math.min(1, n));

function splitText(children: ReactNode): ReactNode {
  return Children.map(children, (child): ReactNode => {
    if (typeof child === 'string' || typeof child === 'number') {
      return String(child).split(/(\s+)/).map((word, w) => /^\s+$/.test(word) ? word :
        <span key={w} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
          {Array.from(word).map((char, i) => <span key={i} data-scramble-char={char}
            style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ opacity: 0 }}>{char}</span>
            <span data-scramble-ink style={{ position: 'absolute', inset: 0, opacity: 0 }}>{char}</span>
          </span>)}
        </span>);
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(child as ReactElement<{ children?: ReactNode }>, {}, splitText(child.props.children));
    }
    return child;
  });
}

export default function ScrollScrambleIn({ children, progress, range }: {
  children: ReactNode; progress: MotionValue<number>; range: [number, number];
}) {
  const root = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion() ?? false;
  const [start, end] = range;
  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    let disposed = false;
    let letters: { ink: HTMLElement; char: string; diagonal: number }[] = [];
    const draw = (value: number) => {
      const p = clamp((value - start) / (end - start));
      letters.forEach(({ ink, char, diagonal }, i) => {
        // Relieve: frente diagonal estrecho y ascenso de 5 px al descifrarse.
        const local = p >= 1 ? 1 : clamp((p - diagonal * 0.8) / 0.2);
        ink.style.opacity = String(reduced ? p : local >= 1 ? 1 : clamp(local * 5) * 0.5);
        ink.style.transform = reduced ? 'none' : `translateY(${(1 - local) * 5}px)`;
        ink.textContent = reduced || local >= 1 || local <= 0 ? char :
          characters[(i * 17 + Math.floor(local * 4)) % characters.length];
      });
    };
    const measure = () => {
      if (disposed) return;
      const bounds = container.getBoundingClientRect();
      const measured = Array.from(container.querySelectorAll<HTMLElement>('[data-scramble-char]')).map((el) => {
        const rect = el.getBoundingClientRect();
        return { ink: el.querySelector<HTMLElement>('[data-scramble-ink]')!, char: el.dataset.scrambleChar!,
          diagonal: rect.left - bounds.left + rect.top - bounds.top };
      });
      const low = Math.min(...measured.map((l) => l.diagonal));
      const high = Math.max(...measured.map((l) => l.diagonal));
      letters = measured.map((l) => ({ ...l, diagonal: (l.diagonal - low) / Math.max(1, high - low) }));
      draw(progress.get());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    document.fonts.ready.then(measure);
    const unsubscribe = progress.on('change', draw);
    return () => { disposed = true; observer.disconnect(); unsubscribe(); };
  }, [children, progress, start, end, reduced]);
  return <><span className="sr-only">{children}</span>
    <span ref={root} aria-hidden="true" style={{ display: 'block' }}>{splitText(children)}</span></>;
}
