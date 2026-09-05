export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="footer"
      className="sticky bottom-0 left-0 z-0 flex min-h-[480px] md:min-h-[560px] w-full flex-col justify-between bg-text text-bg px-6 py-12 sm:px-12 sm:py-16 md:px-20 md:py-20 border-t border-muted/20 select-none"
    >
      {/* Encabezado del Footer */}
      <div className="flex flex-col gap-1 sm:gap-2">
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-bg">
          Esto no ha terminado.
        </h2>
        <p className="font-contrast italic text-2xl sm:text-4xl md:text-5xl text-bg font-normal">
          ¿Qué idea tienes?
        </p>
      </div>

      {/* Bloques de contacto con etiquetas y enlaces subrayados */}
      <div className="flex flex-col gap-6 sm:gap-8 my-8 md:my-10">
        {/* MAIL */}
        <div className="flex flex-col gap-1.5 items-start">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            mail
          </span>
          <a
            href="mailto:sp6670280@gmail.com"
            className="text-lg sm:text-2xl md:text-3xl text-bg underline underline-offset-8 decoration-1 hover:text-accent hover:decoration-accent transition-colors duration-200"
          >
            sp6670280@gmail.com
          </a>
        </div>

        {/* CALL */}
        <div className="flex flex-col gap-1.5 items-start">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            teléfono
          </span>
          <a
            href="tel:+522212043005"
            className="text-lg sm:text-2xl md:text-3xl text-bg underline underline-offset-8 decoration-1 hover:text-accent hover:decoration-accent transition-colors duration-200 font-sans tracking-wide"
          >
            +52 221 204 3005
          </a>
        </div>

        {/* ADD */}
        <div className="flex flex-col gap-1.5 items-start">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            whatsapp
          </span>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="text-lg sm:text-2xl md:text-3xl text-bg underline underline-offset-8 decoration-1 hover:text-accent hover:decoration-accent transition-colors duration-200"
          >
            Platicar proyecto
          </a>
        </div>
      </div>

      {/* Barra inferior con Scroll to Top */}
      <div className="flex w-full items-center justify-between pt-4 border-t border-white/10 text-xs text-muted">
        <span>© {new Date().getFullYear()} Santiago Palma</span>

        <button
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className="group flex items-center justify-center p-2 text-muted hover:text-bg transition-transform hover:-translate-y-1 cursor-pointer"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 stroke-current transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
