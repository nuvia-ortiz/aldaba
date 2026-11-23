# Pendientes — Aldaba

Revisado el 23-nov-2026.

## Estado comprobado
- **Plugin de Figma:** probado contra una simulación de la API de Figma (completo, plan sin modo oscuro y sin la fuente Fraunces). **Aún no se ha ejecutado en Figma real.**
- **Web en HTML y CSS (`site/`):** 27 pruebas en verde en local (axe WCAG 2.2 AA en claro y oscuro, escritorio y móvil; formulario; menú; sin desplazamiento horizontal; peso de página). Revisada a ojo con las capturas de `docs/`.
- `npm run tokens:check` en verde: la web y Figma usan los mismos tokens.

## Lo que falta
1. **Crear el repositorio en GitHub y subirlo.** Está en git local, sin remoto. Al subirlo:
   - activar GitHub Pages con la opción **GitHub Actions** (el flujo `pages.yml` ya está);
   - poner la URL de Pages en el campo «Website» del repositorio.
2. **Ejecutar el plugin en Figma de escritorio** y arreglar lo que salga.
3. **Fotos reales** (propias o con licencia libre) en Figma y en la web, en WebP y con `width` y `height` para que la página no salte al cargar.
4. **Retoques a mano en Figma:** ritmo vertical en el móvil, prototipo conectado, publicarlo en Figma Community.
5. **Revisar contraste con un plugin de Figma** y anotarlo en `CASO-DE-ESTUDIO.md`.
6. **Añadir Aldaba a la web portfolio** (sección «Diseño»), con enlaces a Figma Community, la demo y el repositorio.
7. **Comparar Figma frente a la web con Frameproof** cuando el archivo de Figma exista. Sería una buena demostración de ese proyecto.

## Ideas
- Página de cada habitación con galería.
- Versión en inglés.
- Fuentes alojadas en el propio sitio, en lugar de Google Fonts, para cargar menos en conexiones lentas.
