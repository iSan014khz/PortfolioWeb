import AnimatedTitle from '@/components/AnimatedTitle'

export default function Contact() {
  return (
    <section id="contact" className="flex min-h-svh w-full flex-col items-center justify-start px-5 py-8 border-b border-muted">
      <div className="flex w-full flex-col gap-10">
        <AnimatedTitle animation="ease">
          Contacto
        </AnimatedTitle>

        <div className="font-body text-sm max-w-[280px] text-text py-1 will-change-transform">
          <p className="leading-relaxed">
            Estoy disponible para construir tus <span className="font-body font-bold">ideas más ambiciosas</span>, o colaborar en <span className="text-accent font-semibold">grandes proyectos.</span>
          </p>
          <p className="font-body text-xs text-muted py-2">
            Promedio de respuesta: <span className="text-text font-medium">24 hrs.</span>
          </p>
        </div>

        <form action="/" className="relative flex flex-col gap-5 rounded-2xl sm:rounded-3xl border border-white/10 bg-bg/80 backdrop-blur-sm p-6 sm:p-8 max-w-xl shadow-2xl">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-body text-xs sm:text-sm font-medium text-text/90">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              placeholder="Tu nombre o empresa"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-text placeholder:text-muted/40 transition-colors duration-150 focus:border-accent focus:bg-white/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-body text-xs sm:text-sm font-medium text-text/90">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-text placeholder:text-muted/40 transition-colors duration-150 focus:border-accent focus:bg-white/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="font-body text-xs sm:text-sm font-medium text-text/90">
              Mensaje
            </label>
            <textarea
              id="message"
              rows={4}
              placeholder="Cuéntame sobre tu proyecto o idea..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-text placeholder:text-muted/40 transition-colors duration-150 focus:border-accent focus:bg-white/[0.06] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3 font-body text-sm font-medium text-text transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] cursor-pointer self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Enviar mensaje
          </button>
        </form>
      </div>
    </section>
  )
}
