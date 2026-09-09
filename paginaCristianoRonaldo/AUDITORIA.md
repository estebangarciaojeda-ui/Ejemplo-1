# Auditoría de accesibilidad, UX y diseño responsive

Fecha: 7 de septiembre de 2026. Archivos: `index.html`, `styles.css` y `script.js` de esta carpeta.

## 1. Resumen ejecutivo

La página tiene una buena base semántica: idioma declarado, un encabezado principal, regiones identificadas, controles nativos, tabla con encabezados y estados ARIA actualizados mediante JavaScript. Sin embargo, la cascada CSS introduce dos fallos de contraste en hover y recorta el indicador de foco de los desplegables. Los botones de galería omiten la etiqueta visible «Ampliar» en su nombre accesible.

Resultado: **0 hallazgos críticos, 4 altos, 2 medios y 2 bajos**. Las prioridades son editoriales, no niveles oficiales de WCAG. No se certifica conformidad WCAG 2.2 AA.

### Alcance y método

- Lectura estática completa de los tres archivos, incluidos estados interactivos, reglas responsive y código de arranque.
- Ejecución de `node --check paginaCristianoRonaldo/script.js`: finalizó correctamente, sin errores sintácticos. Esto no comprueba ejecución en el DOM ni errores de consola.
- Comprobación automatizada de referencias mediante extracción de atributos: 34 identificadores, todos únicos; sin destinos ausentes en `href="#…"`, `aria-controls` y `aria-labelledby`; todos los archivos referidos por `src` y `data-imagen` existen. No es una validación integral del HTML.
- Cálculo de contraste sRGB para las combinaciones opacas indicadas en este informe. No se midieron píxeles renderizados, fondos compuestos ni todos los estados posibles.
- Análisis de las reglas aplicables a 320 px, 768 px y escritorio de 1440 px, suponiendo tamaño raíz de 16 px. **No se abrió ni ejecutó la página en un navegador, no se emularon viewports y no se realizaron pruebas con lector de pantalla.** Las predicciones de distribución no equivalen a resultados visuales.
- Los JPEG se comprobaron por existencia y tamaño de archivo; no se inspeccionaron visualmente ni se verificó su decodificación o correspondencia exacta con los textos alternativos.
- Los tres archivos fuente permanecen sin cambios. La única escritura de esta auditoría es este informe.

Referencia normativa: [WCAG 2.2, recomendación del W3C](https://www.w3.org/TR/WCAG22/). Las observaciones de UX y los riesgos pendientes se distinguen de los incumplimientos sustentados en el código.

## 2. Hallazgos críticos, altos, medios y bajos

| ID | Prioridad | Hallazgo | Estado de evidencia |
| --- | --- | --- | --- |
| A1 | Alta | Texto blanco sobre dorado en el enlace principal al pasar el puntero | Confirmado por cascada y cálculo |
| A2 | Alta | El texto del filtro seleccionado desaparece sobre su fondo al pasar el puntero | Confirmado por cascada y cálculo |
| A3 | Alta | El contorno de foco exterior de los desplegables queda recortado | Sustentado en geometría CSS; pendiente corroboración visual |
| A4 | Alta | «Ampliar» no forma parte del nombre accesible de los botones de galería | Confirmado en marcado |
| M1 | Media | Las cifras dependen de la visibilidad y empiezan en cero | Confirmado en HTML y flujo JavaScript; impacto con lector pendiente |
| M2 | Media | Sin JavaScript, el menú móvil y los detalles de trayectoria quedan inaccesibles | Confirmado en HTML/CSS; mejora de resiliencia |
| B1 | Baja | Las miniaturas usan los mismos JPEG grandes que el visor | Confirmado en rutas y tamaños; impacto de red no medido |
| B2 | Baja | Las instrucciones de trayectoria incluyen detalles técnicos ajenos a la tarea | Confirmado en contenido; UX |

No se identifican bloqueos críticos demostrables. Las comprobaciones pendientes del apartado 5 no se contabilizan como problemas confirmados.

## 3. Evidencia concreta: archivo y elemento afectado

### A1. Contraste del enlace principal en hover

`index.html:60`, enlace «Ver su trayectoria», clases `boton boton--primario`. `styles.css:153` asigna texto oscuro y fondo degradado dorado. `styles.css:91`, `a:hover { color: var(--blanco); }`, tiene mayor especificidad que `.boton--primario` y cambia el texto a blanco.

Contraste blanco con los extremos del degradado: **1,58:1** sobre `#f4c85f` y **2,60:1** sobre `#c9992f`. Incumple [1.4.3 Contraste mínimo](https://www.w3.org/TR/WCAG22/#contrast-minimum). Afecta a todos los anchos cuando se activa hover.

### A2. Contraste del filtro seleccionado en hover

`index.html:165–170`, botones `.filtro`. `styles.css:466`, `.filtro:hover`, establece texto dorado; `styles.css:471`, `.filtro--activo`, establece fondo dorado y texto oscuro. El selector de hover tiene mayor especificidad: en el filtro activo resultan texto y fondo `#f4c85f`, **1:1**. Puede ocurrir al situarse sobre «Todos» inicialmente y tras seleccionar cualquier filtro. Incumple 1.4.3.

### A3. Foco recortado en trayectoria

`index.html:182` y los otros cinco `.hito__boton`. `styles.css:136` dibuja el foco con `outline: 3px` y `outline-offset: 3px`. `styles.css:527` aplica `overflow: hidden` al artículo contenedor; el botón ocupa todo su ancho y, plegado el detalle, prácticamente toda su altura interior. El contorno se dibuja fuera del botón y se recorta por el artículo. No hay otro estilo específico de foco en ese botón; el fondo alternativo está definido únicamente para hover.

Riesgo directo de incumplimiento de [2.4.7 Foco visible](https://www.w3.org/TR/WCAG22/#focus-visible), especialmente con tarjetas plegadas. Debe corroborarse tabulando en el navegador. La galería también recorta contornos, pero allí sí existe una señal adicional de foco —oscurecimiento, ampliación y rótulo—; no se declara automáticamente el mismo incumplimiento para ella.

### A4. Nombre accesible sin «Ampliar»

`index.html:445–475`: los tres botones obtienen su nombre del `alt` de la imagen. Sus rótulos «Ampliar» tienen `aria-hidden="true"` en las líneas 450, 462 y 474. `styles.css:778` hace visible ese texto al pasar el puntero o enfocar el botón. El nombre accesible describe la fotografía pero no contiene la etiqueta textual visible, lo que dificulta la activación por voz usando «Ampliar».

Incumple [2.5.3 Etiqueta en el nombre](https://www.w3.org/TR/WCAG22/#label-in-name). No son botones sin nombre: el defecto es la discrepancia entre etiqueta y nombre.

### M1. Cifras iniciales en cero y actualización condicionada

`index.html:342–367`: los seis contadores contienen `0`. `script.js:208–218` solo inicia la actualización al intersectar el viewport; `script.js:176–198` anima valores intermedios. La preferencia de movimiento reducido se evalúa dentro de `animar`, por lo que tampoco elimina la espera de intersección cuando existe `IntersectionObserver`.

Sin JavaScript, las cifras permanecen en cero. Una lectura virtual que no provoque intersección puede encontrar esos ceros; ese escenario necesita prueba con tecnología de asistencia. Es un defecto de robustez del contenido y un riesgo de acceso a información equivalente, sin atribuir un incumplimiento WCAG concluyente a un lector no probado.

### M2. Ausencia de alternativa para funcionalidades sin JavaScript

`styles.css:980–992` oculta la navegación a 760 px o menos; solo el script añade `.navegacion--abierta`. `index.html:188` y los otros cinco paneles de trayectoria comienzan con `hidden`; únicamente `script.js:115–129` los despliega. Si el script no carga, quedan controles inoperantes y detalles ocultos. Los enlaces del pie todavía permiten parte de la navegación.

Mejora de resiliencia y UX, **no incumplimiento automático de WCAG por depender de JavaScript**. No se ha detectado que el script falle realmente durante una carga normal.

### B1. Peso de las imágenes de galería

`index.html:448,460,472` emplea archivos de 1280 px declarados también usados por el visor. Tamaños existentes: Real Madrid, 361.347 bytes; Balón de Oro, 690.303 bytes; Al Nassr, 126.888 bytes. No hay `srcset` ni `sizes`. El total de los tres archivos únicos es 1.178.538 bytes; la imagen de portada y la primera miniatura comparten ruta y pueden reutilizar caché.

Es una oportunidad de rendimiento en móvil, no un incumplimiento WCAG demostrado ni una medición de transferencia real.

### B2. Texto técnico dentro de las instrucciones

`index.html:159–162`: «Todo funciona con JavaScript vanilla, sin recargar la página». La primera frase sí explica la tarea —filtrar y desplegar—; la tecnología empleada no ayuda a realizarla. Mejora editorial de UX, sin incumplimiento normativo.

### Criterios y prácticas que cumplen en lo verificable

| Tema | Evidencia y conclusión limitada al código |
| --- | --- |
| Idioma y título | `index.html:2,6`: `lang="es"` y título descriptivo; satisface la implementación de 3.1.1 y 2.4.2. La lectura UTF-8 es correcta; no se atribuye al archivo la mala representación de tildes de una lectura inicial de terminal. |
| Semántica y encabezados | `header`, `nav`, `main`, `section`, `aside`, `footer`; un `h1`, secciones con `h2` y subsecciones con `h3`, sin saltos de nivel detectados. `dl` para ficha y `ol` para etapas. Base adecuada para 1.3.1 y 2.4.6. |
| Tabla | `index.html:373–424`: `caption`, `th scope="col"` y `th scope="row"`; envoltorio con `tabindex="0"`, `role="region"` y nombre. Relaciones explícitas correctas. |
| Salto de bloques | `index.html:14,45`, `styles.css:115–132`: enlace de salto con destino existente y aparición al enfocar. Implementación prevista para 2.4.1; transferencia efectiva de foco pendiente. |
| Botones y enlaces | Acciones con `button type="button"`; navegación con `a href`. Sin `tabindex` positivo ni controles simulados mediante elementos genéricos. Los nombres existen, con la excepción de correspondencia de A4. |
| ARIA | Menú con `aria-controls` y `aria-expanded`; filtros con `aria-pressed`; desplegables con estado sincronizado y `hidden`. Todas las referencias comprobadas resuelven. `aria-current="true"` es válido. |
| Mensajes de estado | `index.html:173`, `script.js:149–153`: resultado del filtro en `role="status"` y actualización textual. Implementación adecuada para 4.1.3; anuncio real pendiente. `aria-live="polite"` es redundante con status, no un defecto. |
| Alternativas de imagen | Las cuatro imágenes de contenido tienen `alt` descriptivos. El visor oculto parte de `alt=""` y recibe el texto de la miniatura al abrirse (`script.js:235–237`). Correspondencia con la fotografía pendiente. |
| Diálogo | `index.html:562–570`, `script.js:232–280`: rol, modalidad, nombre desde pie, foco inicial en cierre, Escape y devolución al disparador. Tab permanece en el único control interactivo actual; existe salida, por lo que no se considera una trampa de teclado. Compatibilidad de modalidad con lectores pendiente. |
| Contrastes opacos correctos | Texto `#e8ecf7` sobre `#121a33`: **14,55:1**; tenue `#a9b4d0` sobre `#1b2547`: **7,22:1**; texto oscuro sobre extremo dorado `#c9992f`: **7,29:1**. No certifica fondos translúcidos/degradados completos. |
| Foco general | `styles.css:136` define contorno verde de 3 px; verde sobre `#121a33`: **8,83:1**. Existe una base visible, con la excepción de recorte A3 y posibles oclusiones por probar. |
| Objetivos táctiles | El cierre mide 2,4 rem = 38,4 px por lado con raíz de 16 px: supera 24 px. No se considera fallo AA por no llegar a 44 px. Menú, filtros y navegación tienen padding amplio; medición final de todas las cajas y excepciones pendiente. Véase [2.5.8 Tamaño mínimo del objetivo](https://www.w3.org/TR/WCAG22/#target-size-minimum). |
| Movimiento y gestos | CSS respeta `prefers-reduced-motion`; JS evita animación si la preferencia estaba activa al cargar. No hay arrastres ni gestos multipunto obligatorios. La animación de contadores dura 1,2 s; no se infiere una infracción de pausa por esa duración. |
| Recursos y carga | Imágenes fluidas, dimensiones declaradas, carga diferida en galería, prioridad alta en portada, script con `defer`, arranque tras DOM listo y alternativa sin `IntersectionObserver`. Sintaxis JS válida. |
| Enlaces externos | Nombres descriptivos, aviso accesible de nueva pestaña y `rel="noopener noreferrer"`. No se comprobó disponibilidad de sitios externos. |

No aplican al contenido inspeccionado los criterios específicos de formularios, autenticación o medios audiovisuales: no hay esas funcionalidades. Esto no equivale a evaluar exhaustivamente todos los criterios A y AA.

## 4. Recomendación de corrección para cada hallazgo

| ID | Corrección propuesta, no aplicada |
| --- | --- |
| A1 | Declarar explícitamente `.boton--primario:hover` con texto oscuro y comprobar el contraste en todo el degradado. |
| A2 | Añadir un estilo `.filtro--activo:hover` que conserve contraste suficiente; verificar todos los filtros tras seleccionarlos. |
| A3 | Dibujar el foco hacia dentro mediante offset negativo, usar un indicador interior o evitar que el ancestro recorte el contorno. Mantener señal inequívoca con detalles plegados y abiertos. |
| A4 | Incluir «Ampliar» en el nombre accesible, por ejemplo con una etiqueta «Ampliar fotografía: …» que distinga cada foto, o haciendo accesible el texto del rótulo. Conservar una alternativa descriptiva de la imagen. |
| M1 | Incluir el valor final en HTML. Si se anima una copia visual, ocultarla a tecnología de asistencia y conservar un valor semántico estable. No anunciar cada fotograma mediante una región viva. |
| M2 | Mostrar navegación y detalles por defecto, activando ocultación y controles al inicializar correctamente JS; valorar `details/summary` para los desplegables. |
| B1 | Proporcionar variantes de imagen con `srcset`/`sizes` y formatos optimizados, manteniendo calidad y una versión grande para el visor. |
| B2 | Dejar en la instrucción solo cómo filtrar y abrir etapas; trasladar la explicación técnica a «Sobre este sitio» si se desea conservar. |

### Evaluación responsive estática

| Ancho | Reglas verificadas y comportamiento previsto | Límite de la conclusión |
| --- | --- | --- |
| 320 px | Contenedor de 280 px; hero y biografía en una columna; foto antes del texto visualmente; menú colapsable; CTA al 100%; títulos de etapa envuelven. Tarjetas mínimas de 240 px, galería de 260 px y fuentes de 280 px caben nominalmente. Tabla mínima de 560 px dentro de scroll local. | No se midió overflow real. La cabecera puede ocupar varias filas y aumentar su altura. El mínimo de fuentes coincide exactamente con el contenedor. |
| 768 px | Contenedor de 728 px; hero/biografía en una columna. **Se usa navegación de escritorio**, porque el corte del menú es 760 px. La lista permite envolver. Los títulos de etapa aún usan la disposición horizontal. | Comprobar altura real de cabecera, reparto de anchuras y títulos largos; no se afirma que desborden. |
| 1440 px | Contenedor máximo de 1140 px; hero y biografía con dos columnas; ficha sticky; grids adaptativos. | Verificar fuente real, lectura, foco y superposición de elementos sticky. |

No hay un `overflow-x: hidden` global que oculte artificialmente un desbordamiento. La tabla tiene scroll local intencionado: una tabla de datos puede requerir disposición bidimensional y no constituye por sí sola una infracción de [1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow). No se garantiza que el resto de la página esté libre de overflow sin medirla.

## 5. Pruebas que deberían repetirse después de corregir

Todas las pruebas de navegador siguientes están pendientes de primera ejecución; deberán realizarse y repetirse tras las correcciones.

1. **Viewports:** 320×568, 768×1024 y 1440×900, además de móvil horizontal y límites 760/761 px. Recorrer toda la página con menú abierto/cerrado, las seis etapas abiertas, cada filtro y cada imagen ampliada. Medir que `document.documentElement.scrollWidth` no supere `clientWidth`; inspeccionar también recortes internos. Aceptar desplazamiento horizontal solo dentro de la tabla cuando haga falta.
2. **Teclado:** recorrer Tab y Shift+Tab sin ratón; activar botones con Enter/Espacio y enlaces con Enter. Verificar foco en los seis acordeones plegados/abiertos y galería, salto al contenido, desplazamiento de tabla, Escape, cierre del visor y retorno al disparador. No exigir navegación con flechas a este grupo de botones ni a estos desplegables.
3. **Menú y cabecera:** al activar un enlace móvil, comprobar que el foco no queda perdido al ocultarse la navegación. Cruzar de escritorio a móvil con un enlace enfocado. El cierre por click no mueve el foco explícitamente (`script.js:45–46`), por lo que el resultado depende del navegador. Verificar también que la cabecera sticky no oculte totalmente controles enfocados (2.4.11): el espacio de scroll es fijo de 5,5 rem y la altura de cabecera puede variar.
4. **Contraste y foco:** medir estados normal, hover, foco, pulsado y seleccionado tras las correcciones A1–A3; incluir fondos translúcidos, degradado del título y rótulo sobre fotografías. Los cálculos estáticos ya ejecutados deben repetirse si cambian colores.
5. **Lector de pantalla y voz:** probar NVDA con Firefox o Chrome y VoiceOver con Safari. Revisar regiones, jerarquía, nombres, relaciones de tabla, anuncios de filtro y estados de botones. Comprobar A4 con nombres que contengan «Ampliar» y se distingan. Leer contadores antes de desplazarse a ellos y durante la animación.
6. **Modal:** comprobar lectura del nombre y foto, aislamiento del fondo con cursor virtual y navegación táctil, Escape y retorno de foco. El código usa `aria-modal` y limita Tab, pero no aplica `inert` al fondo; esto requiere comprobar compatibilidad y no se registra por sí solo como incumplimiento. Con zoom y poca altura, verificar que cierre y pie son alcanzables: el visor bloquea scroll del body y no declara scroll propio.
7. **Zoom y texto:** probar zoom 200 % y 400 %, aumento de texto al 200 % y espaciado de texto de 1.4.12. Revisar pérdida de contenido, cabecera, grids con mínimos fijos, tabla y visor. El hecho de usar `rem` o `clamp()` no demuestra por sí solo cumplimiento.
8. **Táctil:** medir cajas de todos los controles, incluidos enlaces del pie y fuentes; aplicar el umbral de 24×24 CSS px o las excepciones de 2.5.8. Comprobar scroll de tabla y acceso al cierre con un dispositivo táctil real.
9. **Imágenes:** comprobar que cargan los tres JPEG, que los `alt` corresponden a su contenido y que los recortes `object-fit: cover` conservan el motivo. Verificar estabilidad de layout, carga diferida, errores de red y calidad tras optimizar.
10. **JavaScript y resiliencia:** cargar con consola abierta, probar todas las interacciones y cambios de tamaño; comprobar ausencia de excepciones y promesas rechazadas. Desactivar JS y bloquear su descarga para repetir M1/M2. Repetir `node --check` y comprobaciones de identificadores, destinos y archivos locales.
11. **Preferencias:** probar movimiento reducido antes de cargar y al cambiarlo con la página abierta; el JS captura la preferencia solo al arrancar. Probar colores forzados: el bloque `@media print` no es un modo `forced-colors`, pese al comentario del CSS. No se declara fallo sin comprobar el resultado renderizado.

### Integridad de los archivos auditados

SHA-256 de referencia para comprobar que no se modificaron durante la auditoría:

| Archivo | SHA-256 |
| --- | --- |
| `index.html` | `A93730B5A43D0D63888090B7349AFD64A2E030A3866D799E9E6E186FC778DB90` |
| `styles.css` | `8F66A86B74BD2735A31F0639474911C23FD2A40C132FE954D480DE7D69BC25C0` |
| `script.js` | `5E424FEFC0025468A8D9B4372B77AB84771E176DFF0E450956C1C13BFD8B3461` |
