import { Container } from '@/components/Section'
import { useReducedMotion } from 'motion/react'

export default function Footer() {
  const reduced = useReducedMotion() ?? false
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <footer
      id="footer"
      data-surface="inverse"
      className="sticky bottom-0 left-0 z-0 flex min-h-[480px] md:min-h-[560px] lg:min-h-[640px] w-full flex-col bg-surface-inverse text-text-inverse px-5 py-12 sm:px-8 sm:py-16 md:px-gutter md:py-20 border-t border-rule-inverse"
    >
      <Container className="flex flex-1 flex-col justify-between">
        {/* Encabezado del Footer */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-bg">
            Esto no ha terminado.
          </h2>
          <p className="font-contrast italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-bg font-normal">
            ¿Qué idea tienes?
          </p>
        </div>

        {/* Bloques de contacto con etiquetas y enlaces subrayados */}
        <div className="flex flex-col gap-6 sm:gap-8 my-8 md:my-10">
          {/* MAIL */}
          <div className="flex flex-col gap-1.5 items-start">
            <span className="text-caption font-medium tracking-widest text-text-inverse-secondary uppercase">
              mail
            </span>
            <a
              href="mailto:sp6670280@gmail.com"
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-bg underline underline-offset-8 decoration-1 hover:text-accent hover:decoration-accent transition-colors duration-200"
            >
              sp6670280@gmail.com
            </a>
          </div>

          {/* WHATSAPP — sustituye al bloque de teléfono: el número deja de aparecer como texto
              rastreable y sigue siendo un canal de contacto directo, con el mensaje ya escrito. */}
          <div className="flex flex-col gap-1.5 items-start">
            <span className="text-caption font-medium tracking-widest text-text-inverse-secondary uppercase">
              whatsapp
            </span>
            <a
              href="https://wa.me/522212043005?text=Hola%20Santiago%2C%20vi%20tu%20portfolio%20y%20me%20gustar%C3%ADa%20platicar%20un%20proyecto."
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-bg underline underline-offset-8 decoration-1 hover:text-accent hover:decoration-accent transition-colors duration-200"
            >
              Platicar proyecto
            </a>
          </div>
        </div>

        {/* Barra inferior con Scroll to Top */}
        <div className="flex w-full items-center justify-between pt-4 border-t border-rule-inverse text-caption text-text-inverse-secondary">
          <span>© {new Date().getFullYear()} Santiago Palma</span>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Volver arriba"
            className="group flex size-11 items-center justify-center text-text-inverse-secondary hover:text-text-inverse transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 stroke-current transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </Container>
    </footer>
  );
}
