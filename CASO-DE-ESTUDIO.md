# Guion del caso de estudio (para la web portfolio)

Rellenar con tu voz y tus decisiones reales. Cada apartado lleva una captura del Figma.

## 1. El encargo
Casa de huéspedes pequeña en el centro histórico de Camagüey (ficticia). Objetivo: que un viajero entienda en 10 segundos dónde está, cómo son las habitaciones y cuánto cuestan, y que pueda pedir una reserva **sin pagar por adelantado**.

## 2. Restricciones del contexto
- Conexión lenta y cara: páginas ligeras, sin vídeo, fotos optimizadas.
- Apagones: se convierte en argumento de venta («Luz de respaldo»).
- Pago al llegar: el formulario pide lo mínimo y explica qué pasa después.

## 3. Identidad
Paleta tomada de la ciudad:
- Terracota del tinajón como acento.
- Verde de patio para estados de éxito y el foco del teclado.
- Arena de la cal como fondo.

Serifa en los titulares para el aire colonial e Inter para leer cómodo en el móvil. *(Captura: página Fundamentos.)*

## 4. Sistema de diseño
- **Tokens en dos niveles:** los primitivos (terracota/600) y los semánticos (accent/default). Así el modo oscuro es solo otro modo de la misma colección, sin duplicar componentes.
- **Componentes:** Button con 27 variantes, Input con estados de foco y error, Badge, Room card, Navbar y Footer. *(Captura: página Componentes.)*

## 5. Decisiones de UX
- **El error del formulario dice cómo arreglarlo** («Falta el dominio: escribe, por ejemplo, ana@correo.com»), no solo «correo inválido».
- **El foco del teclado es visible:** borde verde de 2 px, con contraste de al menos 3:1.
- **El resumen de la reserva va junto al formulario,** para que el total no sea una sorpresa.
- **El precio va siempre visible en la tarjeta,** con su moneda.

## 6. Accesibilidad
Contrastes calculados con la fórmula de la WCAG 2.x sobre los hex:

| Par | Contraste | Mínimo |
|---|---|---|
| Blanco sobre botón terracota (claro) | 5.34 | 4.5 |
| Texto secundario sobre arena | 5.62 | 4.5 |
| Error rojo sobre blanco | 6.57 | 4.5 |
| Botón en oscuro (tinta sobre terracota claro) | 7.80 | 4.5 |
| Foco verde sobre blanco / sobre tinta | 5.09 / 3.39 | 3 |

**Hallazgo y corrección:** el borde de los campos del formulario (arena 400) daba **2.15:1** sobre blanco y no cumplía el mínimo de 3:1 para controles (WCAG 1.4.11): alguien con baja visión no vería dónde escribir. Se creó **arena 600** (#8C7B62, 4.10:1). En oscuro, el borde pasó de tinta 500 (2.57:1) a tinta 300 (5.54:1).

**Segundo hallazgo, en la maqueta:** la prueba automática con axe detectó que en modo oscuro el texto secundario sobre el fondo de sección daba 4.34:1. Se corrigió el token en Figma (tinta 200, 5.25:1) y la web lo heredó sola, porque los tokens CSS se generan desde los de Figma.

Añadir aquí también el resultado de la revisión con un plugin de contraste en Figma.

## 7. Resultado
Pantallas de escritorio y móvil, más el modo oscuro. Enlaces: archivo en Figma Community y, en la fase 2, la maqueta en HTML y CSS.

## 8. Qué haría después
Página de cada habitación con galería, calendario de disponibilidad, versión en inglés.
