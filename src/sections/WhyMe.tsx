import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { useRef, useMemo } from 'react';
import { interpolate } from 'flubber';
import yoImg from '@/assets/yo.jpg';
import SvgTextZoom from '@/components/ui/svg-text-zoom';

// Silueta vectorial geográfica oficial de la República Mexicana (centrada en 1000x1000)
const MEXICO_MAP_PATH = "M 640.2,435 L 628.9,460.5 L 623.9,481.3 L 621.7,520.2 L 618.9,534.4 L 624,550.3 L 633,564.4 L 638.8,586.9 L 658,608.5 L 664.8,625.1 L 676.2,639.4 L 707,647.1 L 719,659.2 L 744.4,651.1 L 766.6,648.2 L 788.3,643 L 806.6,638 L 825.1,626.1 L 832,609.2 L 834.4,584.8 L 839.4,576.3 L 859,568.7 L 889.7,562 L 915.4,563 L 933,560.6 L 940,566.7 L 939,580.7 L 923.4,598 L 916.5,615.6 L 921.9,620.7 L 917.5,633.2 L 910.2,655.9 L 902.9,648.4 L 896.8,648.9 L 891.3,649.3 L 880.9,666.8 L 875.6,663.4 L 872.1,664.7 L 872.3,669 L 845.5,668.7 L 818.4,668.7 L 818.4,685.1 L 805.3,685.1 L 816.1,694.8 L 826.8,701.5 L 830,707.8 L 834.7,709.6 L 834,719.5 L 796.7,719.5 L 782.7,743.2 L 786.9,748.6 L 783.5,755.4 L 782.8,763.9 L 749.9,732.6 L 735,723.2 L 711.3,715.6 L 695.1,717.8 L 671.7,728.7 L 657.1,731.5 L 636.6,723.9 L 614.9,718.4 L 587.7,705 L 566,701 L 533.1,687.5 L 508.8,673.6 L 501.5,665.9 L 485.2,664.1 L 455.6,654.9 L 443.5,641.7 L 412.3,625.2 L 397.7,606.9 L 390.8,592.8 L 400.5,589.9 L 397.5,581.7 L 404.2,574.1 L 404.3,564.1 L 394.5,551.1 L 391.9,539.5 L 382.2,524.9 L 356.6,496 L 327.4,473.3 L 313.3,455.2 L 288.4,443.4 L 283,436.3 L 287.5,418.3 L 272.7,411.6 L 255.5,397.5 L 248.3,377.2 L 232.7,374.8 L 215.8,359.6 L 202.2,345.4 L 201,336.4 L 185.3,314.5 L 175.1,292.2 L 175.5,281.1 L 154.5,269.6 L 144.8,270.8 L 128.3,262.9 L 123.6,274.6 L 128.4,288.6 L 131.2,310.4 L 141.2,322.3 L 162.7,342.3 L 167.5,349.2 L 171.9,351.2 L 175.8,361.2 L 180.9,360.8 L 186.7,379.5 L 195.6,386.9 L 201.7,397.2 L 220,412 L 229.6,439 L 238.2,451.7 L 246.3,465.3 L 247.9,480.6 L 261.9,481.5 L 273.5,494.7 L 284.1,507.7 L 283.4,512.9 L 271.1,523.6 L 266,523.4 L 258.3,505.8 L 239.3,489.2 L 218.4,475.2 L 203.6,467.8 L 204.5,446.6 L 200.1,430.9 L 186.3,421.9 L 166.3,408.9 L 162.5,412.6 L 155.2,405.1 L 137.3,398 L 120.2,381.2 L 122.3,379 L 134.2,380.6 L 145,369.8 L 146.1,356.7 L 123.7,336 L 106.7,328 L 96,309.8 L 85.2,290.8 L 71.8,267.6 L 60,241.5 L 93,239.3 L 129.9,236.1 L 127.1,241.8 L 171,255.9 L 237.2,276.3 L 294.9,276.1 L 317.9,276.1 L 318,264.1 L 368.3,264.2 L 378.9,274.5 L 393.7,283.6 L 411,296.4 L 420.6,311.6 L 427.8,327.5 L 442.8,336.3 L 466.9,345 L 485.2,322.1 L 508.9,321.5 L 529.4,333.1 L 543.9,352.9 L 554,370 L 571.1,386.5 L 577.5,406.8 L 585.6,420.5 L 608.3,429.5 L 628.9,435.8 L 640.2,435 Z";

// Path del cuadrado final con esquinas suavemente redondeadas
const SQUARE_PATH = "M 60,40 L 940,40 Q 960,40 960,60 L 960,940 Q 960,960 940,960 L 60,960 Q 40,960 40,940 L 40,60 Q 40,40 60,40 Z";

export default function WhyMe() {
    const sectionRef = useRef<HTMLElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // 1. Detección del progreso de scroll sobre toda la sección para sincronizar con Lenis
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    // 2. Físicas suaves (useSpring) aplicadas al progreso del scroll general
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 220,
        damping: 28,
        mass: 0.5,
        restDelta: 0.001
    });

    // 3. Revelación de los demás textos: inicia JUSTO cuando ya atravesamos la 'O' por completo
    const contentOpacity = useTransform(smoothProgress, [0.4, 0.52], [0, 1]);
    const contentY = useTransform(smoothProgress, [0.40, 0.52], [24, 0]);
    const contentPointerEvents = useTransform(smoothProgress, (v) => (v >= 0.40 ? "auto" : "none"));

    // 4. Mapeo del progreso para la animación de morphing de México hacia el cuadrado
    const rawMorphProgress = useTransform(smoothProgress, [0.54, 0.88], [0, 1]);

    // Interpolador de morphing continuo entre la silueta de México y el cuadrado
    const interpolator = useMemo(() => {
        return interpolate(MEXICO_MAP_PATH, SQUARE_PATH, {
            maxSegmentLength: 2,
        });
    }, []);

    // Interpolación del path vectorial calculada en tiempo real
    const currentPath = useTransform(rawMorphProgress, (t) => {
        const clampedT = Math.max(0, Math.min(1, t));
        return interpolator(clampedT);
    });

    // Zoom parallax sutil de la foto
    const imageScale = useTransform(rawMorphProgress, [0, 1], [1.4, 1.0]);
    // Transiciones de opacidad: el relleno blanco se desvanece mientras la foto entra
    const whiteFillOpacity = useTransform(rawMorphProgress, [0, 0.55], [1, 0]);
    const imageOpacity = useTransform(rawMorphProgress, [0, 0.65], [0, 1]);

    return (
        <section
            ref={sectionRef}
            id="why-me"
            className="relative w-full border-b border-muted min-h-[280vh]"
        >
            {/* Contenedor sticky que mantiene la vista fija mientras el usuario recorre la animación */}
            <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden px-5 sm:px-8 md:px-12 py-8 sm:py-12">
                {/* Capa de SvgTextZoom para 'Porqué yo?' con super-zoom que atraviesa la letra 'o' */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-5 sm:px-8 md:px-12 z-20">
                    <SvgTextZoom
                        text="Porqué yo?"
                        progress={smoothProgress}
                        zoomScrollRange={[0, 0.4]}
                        fadeScrollRange={[0.38, 0.4]}
                        hideThreshold={0.42}
                        finalWidth={6.5}
                        finalHeight={2.4}
                        charFocus="o"
                        charOccurrence="last"
                        textClassName="font-contrast fill-text text-[95px] tracking-editorial select-none"
                        className="w-full max-w-4xl"
                        align="center"
                    />
                </div>

                {/* Contenedor con los demás elementos de la sección que aparecen tras el zoom */}
                <motion.div
                    style={{
                        opacity: contentOpacity,
                        y: contentY,
                        pointerEvents: contentPointerEvents
                    }}
                    className="relative z-10 flex flex-col gap-6 sm:gap-8 w-full max-w-xl mx-auto items-start justify-center will-change-transform"
                >
                    <p className="font-body text-subtitle text-text leading-snug tracking-editorial">
                        Nacido en México. <br />
                        <strong className="font-body font-extrabold">criado en el código.</strong>
                    </p>

                    {/* Contenedor de la foto con morphing SVG puro en todos los ángulos */}
                    <div
                        ref={imageContainerRef}
                        className="relative w-full max-w-md mx-auto aspect-square my-2 sm:my-4 select-none will-change-transform"
                        style={{
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden"
                        }}
                    >
                        <svg
                            viewBox="0 0 1000 1000"
                            className="w-full h-full overflow-visible will-change-transform"
                        >
                            <defs>
                                {/* ClipPath con morphing directo del path */}
                                <clipPath id="mexico-morph-clip">
                                    <motion.path d={currentPath} className="will-change-transform" />
                                </clipPath>
                            </defs>

                            {/* Grupo recortado con la silueta de México */}
                            <g clipPath="url(#mexico-morph-clip)">
                                {/* Imagen fotográfica que aparece progresivamente */}
                                <motion.image
                                    href={yoImg}
                                    width="1000"
                                    height="1000"
                                    preserveAspectRatio="xMidYMid slice"
                                    className="will-change-transform"
                                    style={{
                                        scale: imageScale,
                                        opacity: imageOpacity,
                                        transformOrigin: "center center"
                                    }}
                                />

                                {/* Relleno blanco inicial de la silueta que se desvanece con el scroll */}
                                <motion.rect
                                    width="1000"
                                    height="1000"
                                    fill="#ffffff"
                                    className="will-change-transform"
                                    style={{
                                        opacity: whiteFillOpacity
                                    }}
                                />
                            </g>
                        </svg>
                    </div>

                    <p className="text-text text-body sm:text-base leading-relaxed max-w-xl font-body">
                        Soy <strong className="text-text font-body font-semibold">Santiago Palma</strong>, estudiante de ingeniería de software.
                        Combino la ingeniería con el cuidado obsesivo por el diseño para crear experiencias donde la velocidad, la estética y la interacción dejan un recuerdo.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}