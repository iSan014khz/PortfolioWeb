# Auditoría editorial del portfolio

27 de octubre de 2026 · Revisión de la página principal, no de los prototipos.

## Dictamen

La identidad ya existe: columna estrecha, fondo oscuro, Latin con acentos de Exposure, proyectos en una línea editorial y un cierre claro. La principal oportunidad es unificar la escala y los roles de los tokens. No hace falta convertirlo en una web de ancho completo ni sustituir las animaciones aprobadas.

La columna principal ya está limitada a **760 px**. La sensación de desproporción viene principalmente de tamaños que compiten, espacios verticales que crecen aunque el contenido deje de ensancharse, y colores reutilizados en contextos incompatibles.

## Alcance y evidencia

- Lectura de las secciones activas de `src/App.tsx` y sus componentes de soporte.
- Inspección visual de escritorio a 1280 × 720, con medidas de estilos calculados en el navegador.
- Cálculo de contraste a partir de los colores declarados, sin inferirlo de capturas.
- Detector estático Impeccable ejecutado una vez: no devolvió hallazgos. Eso no certifica accesibilidad ni coherencia visual; los problemas documentados se verificaron manualmente.
- Sin cambios al código de la página, sin pruebas automatizadas ni mediciones de rendimiento. El comportamiento móvil se revisó en el código; no se certificó en un teléfono real.
- Las revisiones auxiliares no pudieron completarse por un límite de uso; la síntesis y la revisión técnica se completaron en el contexto principal. No se presenta como una evaluación independiente doble.

## Qué conservar

- El ancho de 760 px y la alineación general de navegación, hero, proyectos, habilidades y footer.
- Latin como base y Exposure como contraste expresivo. Las cinco fuentes declaradas no implican que cinco familias se estén usando en la vista principal.
- El blanco roto `#f0f0f0`, el fondo `#0d0d0d` y un solo acento azul.
- El cambio a fondo claro al llegar al contacto: funciona como cierre deliberado.
- La convergencia y el foco de la “o”, el mapa de México y el retrato aprobados.
- `Section` y `Container`: ya existe una base reutilizable sobre la que ordenar el sistema.
- La gestión de foco, Escape, retorno del foco e `inert` en el modal. Son una base positiva, aunque el botón de cierre necesite foco visible.

## Hallazgos y decisiones

### 1. P2 · La escala tipográfica no expresa una jerarquía estable

**Evidencia:** a 1280 px, Copy utiliza 48 px con interlínea de 78 px; los proyectos, 44.8 px; las categorías de habilidades, 64 px; los títulos de sección, 32 px; la descripción personal, 16 px; el cierre, 72 px.

**Consecuencia:** un párrafo introductorio y una categoría repetida adquieren casi tanto protagonismo como los momentos principales.

**Propuesta:** mantener el hero expresivo; dar a Copy un estilo de introducción de 28–32 px con interlínea 1.4–1.5; proyectos de 32–40 px; categorías de habilidades de 36–44 px; cuerpo de lectura de 16–18 px. Los rótulos de sección pueden seguir siendo discretos, pero deben compartir tamaño, familia, posición y separación.

**Ubicaciones:** `src/sections/Copy.tsx:157`, `src/sections/Projects.tsx:361`, `src/sections/Skills.tsx:112`, `src/components/AnimatedTitle.tsx:39`, `src/sections/Footer.tsx:16`.

### 2. P2 · El ancho principal está bien; falta distinguir composición y lectura

**Evidencia:** `--container-page: 47.5rem` equivale a 760 px. WhyMe usa un bloque interior `max-w-xl`, de 576 px. El modal mezcla su propio ancho con límites de 700 px y 62ch.

**Consecuencia:** hay medidas razonables, pero no están nombradas como parte de un mismo sistema.

**Propuesta:** conservar `page = 760px`; añadir `reading = 60–65ch`, siempre limitado por el contenedor; y `portrait = 576px` para documentar la composición personal ya aprobada. Los textos más estrechos pueden compartir un borde de la retícula; no es necesario que todos midan lo mismo. Los fondos pueden ocupar la pantalla completa mientras el contenido sigue contenido.

**Ubicaciones:** `src/styles/tokens.css:166`, `src/components/Section.tsx`, `src/sections/WhyMe.tsx`, `src/sections/Projects.tsx:520`.

### 3. P2 · El espacio vertical sigue creciendo cuando el ancho ya se ha detenido

**Evidencia:** `--spacing-section` pasa de 96 a 160 px; se aplica arriba y abajo. Copy y Skills también imponen `min-h-svh`. El hero suma su pantalla mínima a una navegación que está fuera de esa sección.

**Consecuencia:** en PC grande, la columna mantiene 760 px pero la página se vuelve más larga y dispersa. Los espacios entre secciones suman el padding inferior de una y el superior de la siguiente.

**Propuesta:** definir un espacio total entre secciones de 96–128 px, con un solo responsable o mitades explícitas; reservar alturas de pantalla para escenas justificadas, como el hero y WhyMe. No cambiar la altura de WhyMe sin recalibrar su animación de scroll.

**Ubicaciones:** `src/styles/tokens.css:157`, `src/components/Section.tsx:27`, `src/sections/Copy.tsx`, `src/sections/Skills.tsx:172`, `src/sections/Hero.tsx:40`.

### 4. P1 · El gris del footer pierde contraste sobre el fondo claro

**Evidencia:** `#8c8c8c` sobre `#f0f0f0` da aproximadamente **2.95:1**. Se usa en etiquetas de 11 px y en el copyright.

**Propuesta:** crear un rol de texto secundario sobre superficie clara, por ejemplo `#666666`, y comprobar sus estados. Conservar la idea del footer claro. Su separador `border-white/10` también necesita un rol específico sobre claro para ser perceptible.

**Ubicaciones:** `src/sections/Footer.tsx:28`, `:42`, `:57`; `src/styles/tokens.css:68`.

### 5. P1 · El azul de marca no sirve para todos los textos interactivos

**Evidencia:** `#1e44ff` sobre `#0d0d0d` da aproximadamente **3.08:1**. El hover de los enlaces de navegación de 18 px utiliza ese azul; no alcanza 4.5:1 para texto normal.

**Propuesta:** separar `accent` para masas, puntos y trazos de `link-on-dark` para texto. El segundo puede ser un azul más luminoso, con contraste comprobado. Evitar que un hover reduzca la legibilidad del estado normal.

**Ubicaciones:** `src/styles/tokens.css:71`, `src/components/Nav.tsx:86`.

Los umbrales AA son 4.5:1 para texto normal y 3:1 para texto grande; también se aplican a estados hover. [W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### 6. P2 · Los separadores mezclan roles de texto y de borde

**Evidencia:** Nav y WhyMe usan `border-muted`, basado en el gris de texto `#8c8c8c`; otros bloques usan blanco al 10 %, `border-muted/20` o `border-muted/10`. Ya existen tokens específicos de borde.

**Propuesta:** tres roles: `rule-subtle`, `rule-default` y `rule-strong`, con equivalentes sobre el footer claro. Reservar un separador fuerte para cambios de capítulo; no hacer que cada sección invente su opacidad.

**Ubicaciones:** `src/styles/tokens.css:76`, `src/components/Nav.tsx:76`, `src/sections/WhyMe.tsx:135`, `src/sections/Projects.tsx:573`.

### 7. P2 · Los tokens existen, pero varias decisiones importantes los evitan

**Evidencia:** conviven `text-body` de 14.24 px, `text-base`, `text-xl`, tamaños arbitrarios y clamps locales. Tracking y leading están tanto en tokens como en utilidades con valores repetidos. El modal incorpora otro casi negro, `#0c0c0c`, además de los fondos definidos.

**Propuesta:** tokens por función que agrupen tamaño, interlínea, peso y tracking: `display`, `section-label`, `item-title`, `intro`, `body`, `caption`. Añadir roles para superficie elevada, radio de panel, radio de etiqueta y foco. Hacer que las utilidades lean las variables en lugar de duplicar números. No es necesario convertir cada medida aislada de una ilustración SVG en un token.

**Ubicaciones:** `src/styles/tokens.css:110`, `:186`, `src/components/ui/modal.tsx:386`, `src/sections/Skills.tsx:112`.

### 8. P2 · Falta declarar correctamente los estilos y pesos de las fuentes

**Evidencia:** los `@font-face` no declaran `font-weight` ni `font-style`, aunque la interfaz usa medium, semibold, bold, extrabold e italic. Exposure procede de un archivo cuyo nombre indica una variante italic.

**Propuesta:** revisar los metadatos reales de los archivos y declarar sólo los pesos y estilos que soportan. Si Latin es variable, declarar su rango real; si es estática, cargar las variantes necesarias o reducir los pesos usados. Evitar depender de negritas y cursivas sintéticas. Esta revisión no verificó los metadatos internos de las fuentes.

**Ubicación:** `src/styles/tokens.css:6`.

### 9. P2 · Los proyectos necesitan una señal de lectura más clara

**Evidencia:** título y descripción son acciones que abren el modal; las etiquetas tecnológicas son enlaces a sitios externos. En la presentación visual, las etiquetas pueden parecer la interacción principal.

**Propuesta:** añadir una llamada breve y consistente como «Ver proyecto ↗» o «Leer caso», según el destino real. Mantener la descripción como texto de apoyo y una única acción de detalle claramente identificada. Dar a las etiquetas un tamaño y estilo constantes entre proyectos y habilidades.

**Ubicaciones:** `src/sections/Projects.tsx:361`, `:395`, `src/components/TechBadge.tsx:33`.

### 10. P1 · Hay diferencias de accesibilidad entre componentes similares

**Evidencia:** el menú móvil usa un botón de 20 × 20 px y no comunica `aria-expanded`/`aria-controls`; no tiene la gestión de Escape/foco presente en el modal. Los acordeones de Skills tampoco comunican su estado expandido. El cierre del modal elimina el outline sin reemplazo visible.

**Propuesta:** compartir un criterio de estados, foco visible y áreas cómodas de interacción; un objetivo de 44 × 44 px para iconos no exige aumentar el dibujo. Añadir estado y asociación del panel a los acordeones. Reutilizar la disciplina del modal en el menú.

**Ubicaciones:** `src/components/Nav.tsx:96`, `src/sections/Skills.tsx:103`, `src/components/ui/modal.tsx:413` y `:425`.

### 11. P2 · La reducción de movimiento no está aplicada de forma uniforme

**Evidencia:** el título SVG y el scramble tienen alternativas reducidas; `AnimatedTitle` no consulta esa preferencia. El morph de México y la escala de la foto siguen vinculados al scroll aun con `reduced`. Lenis mantiene `smoothWheel: true`; los badges conservan movimiento al interactuar.

**Propuesta:** completar la alternativa accesible del sistema, conservando las animaciones aprobadas en el modo normal. Los bloques de lectura deberían asentarse antes de pedir atención al siguiente efecto.

**Ubicaciones:** `src/components/AnimatedTitle.tsx:34`, `src/sections/WhyMe.tsx:110`, `src/components/smooth-scroll.tsx:4`, `src/components/TechBadge.tsx:28`.

### 12. P2 · La semántica y el coste del texto dividido merecen una pasada

**Evidencia:** Copy expone cientos de spans de letras en el árbol accesible y mantiene `will-change` por carácter. El scramble, en cambio, ofrece una copia legible para lectores de pantalla. El texto SVG de WhyMe está identificado como imagen, pero la sección no tiene un encabezado h2 equivalente. El mapa/retrato no tiene una descripción accesible explícita.

**Propuesta:** dar a Copy una lectura continua accesible, ocultar la capa fragmentada a tecnologías de asistencia y limitar `will-change` a lo necesario. Añadir encabezado semántico a WhyMe y descripción apropiada del retrato. Revisar costes con un perfilador sólo si después se decide optimizar: aquí no se midieron FPS ni tiempos de carga.

**Ubicaciones:** `src/sections/Copy.tsx:43`, `src/components/ui/scroll-scramble-in.tsx`, `src/sections/WhyMe.tsx:132`, `:187`.

## Sistema editorial propuesto para PC

Valores iniciales de diseño, no normas universales ni cambios ya aplicados. Equivalencias con 1rem = 16px.

| Rol | Propuesta | Uso |
| --- | --- | --- |
| Columna principal | 760 px máximo | Composición general y alineaciones |
| Lectura | 60–65ch, máximo 100 % | Párrafos y casos de proyecto |
| Display | 72–90 px | Nombre y momentos principales |
| Rótulo de sección | 28–32 px | Proyectos, Habilidades |
| Título de elemento | 36–40 px, hasta 44 px | Proyecto o categoría |
| Introducción | 28–32 px / 1.4–1.5 | Manifiesto breve de Copy |
| Cuerpo | 16–18 px / 1.55–1.65 | Descripciones y lectura |
| UI y metadatos | 14–16 px / 12–13 px | Navegación / etiquetas |
| Separación entre capítulos | 96–128 px total | No duplicarla en ambos lados |
| Separación interna | 8, 16, 24, 32, 48 px | Grupos, títulos, texto y medios |

En móvil deben existir mínimos deliberados; no trasladar los tamaños de PC a una columna estrecha. La composición aprobada del SVG no debe ajustarse indirectamente al cambiar la tipografía de lectura.

## Qué enseñan las referencias editoriales

**Retícula y alineación.** La guía digital de The Guardian documenta una retícula común, medidas de escritorio contenidas y reglas de alineación entre titulares y metadatos. La lección aplicable es compartir ejes y reglas; no copiar sus anchos de periódico. [Guía digital de The Guardian](https://design.theguardian.com/).

**Roles de tipografía y color.** El sistema de The Guardian distingue familias para marca, titulares y cuerpo, y asigna funciones a sus colores. En este portfolio, Latin + Exposure ya ofrece una división útil; lo pendiente es hacerla consistente. [The Guardian Design System](https://guardian.github.io/theguardian.design/).

**Lectura.** USWDS recomienda un tamaño efectivo de al menos 16 px para la mayoría del texto, alineación a la izquierda y unas 66 posiciones por línea como objetivo para lectura larga; no prescribe que toda la interfaz tenga el mismo ancho. [USWDS: Typography](https://designsystem.digital.gov/components/typography/).

**Proporciones.** Stanford combina escala modular, longitud de línea y retícula; sitúa las líneas habitualmente entre 45 y 75 caracteres. Es un respaldo para introducir una medida de lectura sin perder los ejes generales de la página. [Stanford: Type, grids and color](https://decanter.stanford.edu/for-designers/type-grids-and-color).

## Orden de trabajo recomendado

1. Corregir los dos contrastes y los estados de foco/expansión. Prioridad funcional.
2. Unificar escala de Copy, proyectos, Skills y cuerpo; conservar la identidad tipográfica.
3. Formalizar anchos y ritmo vertical; mantener 760 px como columna principal.
4. Consolidar bordes, superficies, etiquetas y tokens inversos del footer.
5. Completar movimiento reducido y semántica del texto animado.
6. Hacer una sola pasada visual de escritorio y móvil después de implementar, ajustando sólo las divergencias observadas.

La primera pasada de diseño debería concentrarse en **tipografía, ritmo y contraste**. Son las mejoras con mayor impacto sobre la coherencia actual.
