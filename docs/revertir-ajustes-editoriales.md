# Recuperar la versión anterior

Antes de aplicar la auditoría del 27 de octubre de 2026 se guardó una copia del estado real del proyecto, incluidos los cambios locales todavía no registrados en Git.

- Copia completa: `.local-backups/antes-ajustes-editoriales-20261027-080751.zip`.
- Comprobante SHA-256 y número de entradas: archivo JSON con el mismo nombre.
- Originales de los 13 archivos modificados: `.local-backups/editorial-original/`.
- Restauración de esos archivos: `.local-backups/restaurar-editorial.ps1`.

La copia ZIP contiene fuentes, recursos, configuración, prototipos y documentación. Excluye `.git`, `node_modules`, `dist` y la carpeta de copias. Es una copia local privada; no se publica ni se incluye en Git.

Para volver al diseño anterior, basta con pedírselo a Codex. También se puede ejecutar desde la raíz del proyecto:

```powershell
& .\.local-backups\restaurar-editorial.ps1
```

El script primero conserva otra copia de los 13 archivos actuales y después recupera sus originales. No elimina archivos ni restaura el repositorio completo; los demás cambios del proyecto permanecen intactos. La versión anterior se refleja en el servidor de desarrollo al recargar.

## Ajustes aplicados

- Columna principal de 760 px conservada y medidas de lectura/retrato nombradas.
- Escala de introducción, títulos de proyecto, categorías, cuerpo y metadatos consolidada.
- Espaciado vertical más contenido, sin alturas de pantalla en bloques de lectura.
- Roles para enlaces sobre oscuro, texto sobre claro, bordes, superficie elevada y foco.
- Pesos variables de Latin (100–900) y Zirena (200–900) declarados a partir de las tablas reales de las fuentes; Exposure conserva sus contornos y registro normal.
- Acción de proyecto explícita; descripción de lectura y etiquetas compartidas.
- Menú móvil con área de 44 px, estado expandido, Escape, foco y fondo inerte; acordeones con asociaciones accesibles.
- Texto animado con lectura continua accesible y modo de movimiento reducido más uniforme.
- Encuadre, zoom y convergencia de la «O» conservados. Foto y México conservan su animación normal; con movimiento reducido muestran el retrato final sin morph ni zoom.
- En ventanas de hasta 640 px de altura se compacta y desplaza el bloque de contenido 32 px para evitar que el titular se recorte por su deriva vertical. La geometría de la «O» y el recorte del retrato se conservan.

Los prototipos originales siguen disponibles como referencia. Comparten los tokens globales, por lo que la copia ZIP es la referencia exacta del aspecto anterior.

## Verificación

Compilación de producción y TypeScript correctos. Revisión visual e interacción en escritorio (1280 × 800), móvil (390 × 845) y ventanas pequeñas (320 × 569 y 405 × 532). Sin errores de consola observados ni desbordamiento horizontal en esas vistas. Se comprobó apertura/cierre con Escape y retorno de foco del menú y del modal, además de los estados del acordeón.

El análisis estático termina sin errores; mantiene avisos anteriores de scripts de skills y dos del modal (exportación del hook compartido y uso de la prop children). No se añadieron ni ejecutaron suites de pruebas. El script de restauración se revisó sintácticamente sin ejecutarlo y el SHA-256 del ZIP coincide con su comprobante.
