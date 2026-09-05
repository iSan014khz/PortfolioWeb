import { motion } from 'motion/react';

interface PhilosophyCardProps {
    index: string;
    title: string;
    description: string;
    accent?: boolean;
}

const cardsData: PhilosophyCardProps[] = [
    {
        index: "01",
        title: "Precisión y Rendimiento",
        description: "Cada línea de código y cada animación está optimizada para 60/120 FPS sin sacrificar reactividad ni accesibilidad.",
    },
    {
        index: "02",
        title: "Diseño Físico y Emocional",
        description: "Micro-interacciones basadas en físicas reales (muelles, inercia, peso) que hacen que el software se sienta tangible.",
    },
    {
        index: "03",
        title: "Ingeniería de Detalle",
        description: "Tipografía óptica, jerarquía espacial limpia y transiciones imperceptibles pero indispensables.",
    },
    {
        index: "04",
        title: "Impacto y Escalabilidad",
        description: "Sistemas modulares, arquitectura limpia y componentes reutilizables listos para escalar a producción.",
    }
];

export default function Philosophy() {
    return (
        <section id="filosofia" className="relative w-full px-5 py-8 border-b border-muted flex flex-col gap-12 select-none">

            {/* Encabezado */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-accent font-mono text-xs md:text-sm tracking-widest uppercase">
                        Principios y visión
                    </span>
                </div>
                <h2 className="text-text font-contrast text-5xl md:text-8xl font-bold uppercase tracking-tight leading-none">
                    Filosofía
                </h2>
            </div>

            {/* Contenedor de 4 tarjetas unidas */}
            <div className="relative rounded-3xl border border-white/10 bg-bg/80 backdrop-blur-sm overflow-hidden shadow-2xl">

                {/* Cuadrícula 2x2 de tarjetas conectadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">

                    {/* Fila Superior */}
                    <div className="flex flex-col divide-y divide-white/10">
                        {/* Tarjeta 01 */}
                        <motion.div
                            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                            transition={{ duration: 0.2 }}
                            className="group relative p-8 md:p-12 flex flex-col justify-between min-h-[300px] md:min-h-[360px]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm text-accent tracking-widest">{cardsData[0].index}</span>
                                <div className="h-2 w-2 rounded-full bg-white/20 group-hover:bg-accent transition-colors" />
                            </div>

                            {/* Espacio para mini-animación */}
                            <div className="my-6 h-28 w-full rounded-2xl bg-muted/15 border border-white/5 flex items-center justify-center p-4">
                                <span className="text-xs font-mono text-muted/60 uppercase tracking-widest">[ Animación 01 ]</span>
                            </div>

                            <div>
                                <h3 className="font-display text-2xl md:text-3xl font-bold text-text mb-2 group-hover:text-accent transition-colors">
                                    {cardsData[0].title}
                                </h3>
                                <p className="font-body text-muted text-sm md:text-base leading-relaxed">
                                    {cardsData[0].description}
                                </p>
                            </div>
                        </motion.div>

                        {/* Tarjeta 03 */}
                        <motion.div
                            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                            transition={{ duration: 0.2 }}
                            className="group relative p-8 md:p-12 flex flex-col justify-between min-h-[300px] md:min-h-[360px]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm text-accent tracking-widest">{cardsData[2].index}</span>
                                <div className="h-2 w-2 rounded-full bg-white/20 group-hover:bg-accent transition-colors" />
                            </div>

                            {/* Espacio para mini-animación */}
                            <div className="my-6 h-28 w-full rounded-2xl bg-muted/15 border border-white/5 flex items-center justify-center p-4">
                                <span className="text-xs font-mono text-muted/60 uppercase tracking-widest">[ Animación 03 ]</span>
                            </div>

                            <div>
                                <h3 className="font-display text-2xl md:text-3xl font-bold text-text mb-2 group-hover:text-accent transition-colors">
                                    {cardsData[2].title}
                                </h3>
                                <p className="font-body text-muted text-sm md:text-base leading-relaxed">
                                    {cardsData[2].description}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Fila Inferior / Columna Derecha */}
                    <div className="flex flex-col divide-y divide-white/10">
                        {/* Tarjeta 02 */}
                        <motion.div
                            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                            transition={{ duration: 0.2 }}
                            className="group relative p-8 md:p-12 flex flex-col justify-between min-h-[300px] md:min-h-[360px]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm text-accent tracking-widest">{cardsData[1].index}</span>
                                <div className="h-2 w-2 rounded-full bg-white/20 group-hover:bg-accent transition-colors" />
                            </div>

                            {/* Espacio para mini-animación */}
                            <div className="my-6 h-28 w-full rounded-2xl bg-muted/15 border border-white/5 flex items-center justify-center p-4">
                                <span className="text-xs font-mono text-muted/60 uppercase tracking-widest">[ Animación 02 ]</span>
                            </div>

                            <div>
                                <h3 className="font-display text-2xl md:text-3xl font-bold text-text mb-2 group-hover:text-accent transition-colors">
                                    {cardsData[1].title}
                                </h3>
                                <p className="font-body text-muted text-sm md:text-base leading-relaxed">
                                    {cardsData[1].description}
                                </p>
                            </div>
                        </motion.div>

                        {/* Tarjeta 04 */}
                        <motion.div
                            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                            transition={{ duration: 0.2 }}
                            className="group relative p-8 md:p-12 flex flex-col justify-between min-h-[300px] md:min-h-[360px]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-sm text-accent tracking-widest">{cardsData[3].index}</span>
                                <div className="h-2 w-2 rounded-full bg-white/20 group-hover:bg-accent transition-colors" />
                            </div>

                            {/* Espacio para mini-animación */}
                            <div className="my-6 h-28 w-full rounded-2xl bg-muted/15 border border-white/5 flex items-center justify-center p-4">
                                <span className="text-xs font-mono text-muted/60 uppercase tracking-widest">[ Animación 04 ]</span>
                            </div>

                            <div>
                                <h3 className="font-display text-2xl md:text-3xl font-bold text-text mb-2 group-hover:text-accent transition-colors">
                                    {cardsData[3].title}
                                </h3>
                                <p className="font-body text-muted text-sm md:text-base leading-relaxed">
                                    {cardsData[3].description}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                </div>

                {/* Nodo de unión central en SVG (Crosshair / Conector central) */}
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center pointer-events-none z-10">
                    <svg viewBox="0 0 32 32" className="w-8 h-8 text-accent/80">
                        <line x1="16" y1="0" x2="16" y2="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                        <line x1="0" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx="16" cy="16" r="3" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </div>

            </div>
        </section>
    );
}
