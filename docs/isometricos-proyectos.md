# Escenas isométricas de proyectos

## Alcance y reversión

Solo en `/prototypes/projects-editorial/?vista=propuesta&iso=1#projects`. La página principal conserva sus componentes. La versión anterior a la casa por etapas y al comparador de productos está guardada en `.local-backups/antes-casa-y-decision-20261027-190207/`.

## Lenguaje visual

Geometría y paleta de objetos de Anatomy: porcelana, tinta, cuatro grises; verde y rojo pequeños para estados. Lienzo transparente sobre el negro #0d0d0d del portfolio, sin tarjeta blanca ni marco. No hay palabras, cifras ni etiquetas en las ilustraciones; sí descripciones accesibles.

Cada proyecto tiene su propio recorrido vertical y un panel sticky de un viewport. La retícula usa título y descripción arriba, una fila flexible para todo el SVG y el enlace del caso abajo. El selector de prototipos tiene espacio reservado; no tapa el dibujo. Los SVG mantienen su proporción y se encajan por ancho y alto, con composición específica en móvil.

`useScroll` mide desde el inicio del proyecto hasta el final de su tramo sticky. `useSpring` suaviza ese progreso (stiffness 110, damping 27, mass 0.55). El renderer deriva cada pieza del progreso actual: bajar avanza y subir revierte. No hay reloj de reproducción ni bucle automático. La distancia de scroll da más recorrido a Ixtli Data. Con movimiento reducido se muestra una imagen completa y se elimina el tramo largo. El botón de repetir vuelve al inicio del proyecto.

La versión anterior al scroll sticky está en `.local-backups/antes-scroll-sticky-20261027-195623/`.

## Escenas

**Ixtli:** tres negocios se incorporan gradualmente. Envían cajas tridimensionales con avisos positivos o alertas por caminos discontinuos. El estado se refleja en la fila correspondiente del teléfono. La aplicación concentra varios negocios.

**Bohorquez:** terreno vacío, cuatro zapatas, losa, nueve hiladas de mampostería con huecos de puerta y ventanas, carpintería, hastiales, dos faldones de cubierta, cumbrera y acceso. Cada pieza tiene su momento de entrada; la casa completa permanece antes de reiniciar. Se elimina la anterior fachada desplazable, el taller y el andamio.

**Ixtli Data:** tres productos sobre módulos de comparación y una lupa con cristal al 12 % de opacidad. Una vez elegida la oportunidad, esa misma botella abandona el pedestal, se transfiere al empaquetado y baja a una caja y cuatro solapas cierran en sus planos de bisagra. Se sella el paquete, aparecen otros dos con el mismo símbolo de producto y llega una camioneta. Los tres paquetes se cargan por turnos en la caja trasera; sus posiciones finales coinciden con la geometría de carga. La camioneta espera con la carga visible y avanza con su escala completa hasta salir por el borde real de la pantalla. La trayectoria de entrada y salida sigue el eje longitudinal proyectado del vehículo, calculado con la misma cámara que dibuja su carrocería, sin cambiar su escala. La distancia de salida y la ventana horizontal se calculan desde el viewport mediante la matriz SVG; no se recorta al llegar al límite interno de la ilustración ni se desvanece para simular la salida. No hay texto en la ilustración.

El mango de la lupa sigue el radio diagonal del aro en el mismo plano 3D y se une mediante un collar. Las microanimaciones son parte de la acción: cierre escalonado de solapas, sellado, recorrido arqueado de cada caja, ruedas que giran y una suspensión tenue al entrar y salir. Todas avanzan y retroceden con el mismo progreso de scroll. Movimiento reducido muestra la camioneta cargada y estacionada. Los relatos de Ixtli y Bohorquez se conservan y también se controlan con scroll; los estados del teléfono se reconstruyen al retroceder. La versión anterior con bolsa está en `.local-backups/antes-envios-data-20261027-194309/`.

## Pulido de elementos SVG

Contornos exteriores algo más definidos y detalles interiores más finos; paleta neutra y cuatro tonos de luz compartidos. Los negocios tienen remates de cubierta, interiores discretos, bisagras, soportes y bajantes; el teléfono incorpora altavoz, cámara, puerto y símbolos coherentes con cada local. La casa suma juntas laterales, reflejos de ventana, dinteles, cerradura, fascia, canaleta y bajante.

La botella de búsqueda y la de empaquetado usan una sola geometría a diferente escala, con collar, boquilla y un sello gráfico sin texto. Los paquetes muestran pliegues y cinta continua sobre tapa y frontal. La camioneta incorpora juntas de puerta, estribo, soporte de espejo, ópticas, fijaciones del cajón, pasos de rueda y rines con tornillería. El mango de la lupa conserva su unión radial y gana detalles de agarre.

Se conservan la secuencia y los tiempos de las solapas, el sellado, las cajas adicionales y la carga. La transferencia del producto y la salida completa del camión siguen siendo reversibles con el mismo progreso de scroll. Respaldo previo: `.local-backups/antes-pulido-svg-20261027-202929/`.

## Fuentes y generación

- Original: https://github.com/wheresryan22/anatomy
- Adaptación de assets: https://github.com/Teddarific/skills/tree/main/skills/anatomy-asset
- Kit y licencia: `scripts/vendor/anatomy/`.
- Generador: `node scripts/build-project-isometrics.mjs`.
- Escenas: `scripts/project-isometric-scenes.mjs`; empaquetado y camioneta: `scripts/project-isometric-shipping.mjs`; botella compartida: `scripts/project-isometric-details.mjs`.
- Runtime: `src/prototypes/projects-editorial/isometrics/IsometricStory.tsx`.

Se revisan tipos, lint de archivos tocados, XML de SVG y presentación en navegador. No se añade una batería de pruebas. La revisión visual no equivale a una auditoría geométrica exhaustiva del kit.
