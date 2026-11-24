# Pendientes — Aldaba

Revisado el 24-nov-2026.

## Estado comprobado
- **Publicado:** https://github.com/nuvia-ortiz/aldaba · demo en https://nuvia-ortiz.github.io/aldaba/ (CI y Pages en verde el 23-nov; recorrido probado en un navegador sobre la web publicada).
- **Plugin de Figma:** ejecutado en Figma real (plan Starter) el 24-nov. Archivo generado: «Aldaba — Design System», con 3 páginas, 62 variables (32 primitivas, 18 semánticas y 12 de espaciado y radios), 9 estilos de texto (Fraunces disponible), 8 componentes y 4 pantallas. Revisado con capturas. Lo que salió en Figma real y se corrigió en el plugin:
  - El plan Starter solo admite 3 páginas por archivo: Portada y Fundamentos van ahora en la misma página.
  - `resize()` dejaba fijo el alto de los conjuntos de variantes y del pie móvil, y recortaba contenido (solo se veían 6 de las 27 variantes de Button).
  - El plan Starter no permite un segundo modo de variables, así que no hay pantalla en modo oscuro. La portada ya no lo menciona cuando falta.
- **Web en HTML y CSS (`site/`):** 27 pruebas en verde en local (axe WCAG 2.2 AA en claro y oscuro, escritorio y móvil; formulario; menú; sin desplazamiento horizontal; peso de página). Revisada a ojo con las capturas de `docs/`.
- `npm run tokens:check` en verde: la web y Figma usan los mismos tokens.

## Lo que falta
1. **Fotos reales** (propias o con licencia libre) en Figma y en la web, en WebP y con `width` y `height` para que la página no salte al cargar.
2. **Retoques a mano en Figma:** ritmo vertical en el móvil, prototipo conectado, publicarlo en Figma Community.
3. **Revisar contraste con un plugin de Figma** y anotarlo en `CASO-DE-ESTUDIO.md`.
4. **Enlace a Figma Community** en el README y en la web portfolio, cuando esté publicado. Aldaba ya aparece en Proyectos con su demo y su repositorio.
5. **Comparar Figma frente a la web con Frameproof.** El archivo ya existe; falta un token de Figma para que Frameproof lea sus capas. Sería una buena demostración de ese proyecto.
6. **Modo oscuro en Figma:** necesita un plan con más de un modo de variables. La web sí tiene modo oscuro.

## Ideas
- Página de cada habitación con galería.
- Versión en inglés.
- Fuentes alojadas en el propio sitio, en lugar de Google Fonts, para cargar menos en conexiones lentas.
