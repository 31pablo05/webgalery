# Plan de rediseño — Galería editorial oceánica

Referencia visual aprobada: la maqueta azul con texturas, que adjunto en el chat. La maqueta sirve de referencia de composición, proporciones, paleta, jerarquías y tratamiento de imágenes. Sus imágenes, nombres de series ("Umbral", "Topografías", "Trazos de memoria", "Fluidas"), textos, email y la firma "celia gomez perea" son inventados: no se copian.

**Estado de partida.** El sitio ya tiene aplicadas las partes anteriores: fondo oscuro, Inter Tight + Instrument Serif, galería y ficha rediseñadas, límite de 30 obras eliminado. Este plan reemplaza la identidad visual por la de CLAUDE.md. Lo que funciona se conserva: Sanity, lightbox, modal de Vimeo, formulario, noindex, carga progresiva, View Transitions.

**Decisiones de arquitectura** (resuelven redundancias del pedido):
- **Disciplina es un documento de Sanity, no una lista fija.** Pinturas y Obras sobre papel se cargan como disciplinas, y la cuarta se agrega después desde el Studio, sin tocar código.
- **Una sola ruta para obras y disciplinas.** /obras/[slug] resuelve tanto una disciplina (/obras/pinturas, /obras/obras-sobre-papel) como una obra (/obras/rukacorazon). Para eso, el Studio valida que ningún slug se repita entre obras y disciplinas.
- **"Series" y "Obra" se complementan, no se duplican.**
  - /series lista todas las series, con filtro por disciplina.
  - /obras lista todas las obras individuales, con filtro por disciplina.
  - El desplegable "Obra" del menú lleva a cada disciplina.
- **La relación obra–serie se guarda en un solo lado:** la obra referencia a su serie. La serie no guarda una lista de obras, así no hay dos fuentes que se contradigan. El orden dentro de la serie es un campo de la obra.
- **Cambios no destructivos en Sanity.** No se borra ningún tipo ni campo con datos posibles. Un campo que queda obsoleto se oculta en el Studio y se marca como obsoleto, y las consultas lo dejan de usar.

---

## Etapa 1 — Nuevo diseño del Inicio

Archivos:
- src/styles/global.css
- src/layouts/Layout.astro
- src/components/layout/ (Header, Footer, Trazo)
- src/components/home/
- src/pages/index.astro
- src/data/demo.js
- src/lib/sanity.js (solo agregar funciones nuevas)

### 1.1 Base visual
- Reemplazar en global.css la paleta oscura actual por los tokens de CLAUDE.md. Definir dos contextos: claro (blanco cálido o marfil, texto tinta) y azul (azul océano o azul profundo, texto blanco cálido, secundario azul bruma, acento dorado). Cada sección elige el suyo con una clase.
- Tipografías: cargar Cormorant Garamond, Instrument Sans y DM Sans desde Google Fonts con display swap y solo los pesos de CLAUDE.md. Quitar Inter Tight e Instrument Serif.
- Escala:
  - Titulares del hero en Cormorant, entre 56 y 80 px en desktop.
  - Títulos de sección en Instrument Sans: MAYÚSCULAS, 22 a 26 px, espaciado 0.18em.
  - Etiquetas en Instrument Sans, 11 a 12 px, mayúsculas, espaciado 0.2em.
  - Texto en DM Sans, 16 a 17 px, interlineado 1.65.
- Ornamento: una línea dorada fina de 48 a 64 px junto a los títulos de sección y bajo el título del hero, como en la maqueta.
- Botones:
  - Contorno de 1 px (dorado sobre azul, tinta sobre claro), texto en Instrument Sans en mayúsculas espaciadas y flecha →. Hover: relleno muy sutil y la flecha se corre 4 px.
  - Botón relleno (enviar formulario): azul medio con texto blanco cálido.
- Texturas procedurales para las bandas azules: variaciones de tono con aspecto de pigmento al agua, más un grano muy fino, hechas con SVG (feTurbulence) o CSS y concentradas en los bordes de cada banda. Deben ser sutiles. No usar imágenes de las obras ni de public/demo/texturas/.
- Animaciones: aparición suave de secciones al hacer scroll (la que ya existe), hovers y transición del carrusel. Todo respeta prefers-reduced-motion.

### 1.2 Header
- Firma real a la izquierda (unos 120 px en desktop, 96 px en mobile) y una línea vertical fina dorada.
- Navegación horizontal en Instrument Sans, mayúsculas chicas espaciadas: INICIO · OBRA ▾ · SERIES · AUDIOVISUAL · SOBRE LA ARTISTA · CONTACTO.
  - "Obra" despliega las disciplinas (Pinturas, Obras sobre papel), que salen de los datos.
  - El desplegable funciona con hover, click y teclado (Enter, Escape y flechas).
  - Página activa con una línea dorada fina debajo.
- Sobre el hero: transparente, con texto blanco cálido. Al bajar más de 80 px: fondo azul profundo con 90 % de opacidad, desenfoque y línea inferior fina.
- En páginas sin hero azul: fondo blanco cálido, texto tinta.
- Sin selector de idioma ni buscador: no están contemplados.
- Mobile: firma a la izquierda y "MENÚ" a la derecha. Panel a pantalla completa en azul profundo con textura, los links en Cormorant grandes, "Obra" desplegable, y abajo Instagram y Vimeo.

### 1.3 Hero con carrusel (island React, client:load)
- Alto: la primera pantalla, entre 560 y 760 px. Fondo azul océano con textura.
- Cada diapositiva lleva imagen, etiqueta opcional, título, subtítulo, texto del botón y enlace.
- La imagen ocupa unos 2/3 a la derecha. Su borde izquierdo y sus bordes superior e inferior se funden con el azul mediante una máscara con forma irregular, como pigmento, no un degradado recto.
- Texto a la izquierda: título en Cormorant (en mayúsculas como en la maqueta), línea dorada, subtítulo en Instrument Sans en mayúsculas chicas espaciadas color azul bruma, y botón con contorno dorado.
- Flechas laterales finas y puntos indicadores abajo al centro, con área táctil de 44 px.
- Sin autoplay por defecto. Si se activa, se pausa con hover, foco o pestaña oculta. Con una sola diapositiva activa, se ocultan flechas y puntos.
- Teclado: flechas izquierda y derecha cuando el carrusel tiene foco. Fundido de 600 ms entre diapositivas, desactivado con movimiento reducido.
- Rendimiento: la primera diapositiva se renderiza en HTML desde Astro con prioridad alta (es el LCP). Las demás cargan diferidas. El island solo agrega la interacción.
- Demo, con fotos reales, en src/data/demo.js:
  1. Título "Pintura, cuerpo y territorio", subtítulo "Exploraciones visuales entre el gesto, la memoria y el espacio.", botón "Explorar obra" a /obras, imagen celia-bucear.
  2. Etiqueta "Serie destacada", título de la serie de ejemplo, botón "Ver serie", imagen de la obra 10 (cuadro negro con franja).
  3. Etiqueta "Audiovisual", título "Del punto a la línea, un océano", botón "Ver audiovisual" a /audiovisual, imagen celia-proceso-cine.
- Mobile: la imagen arriba con su máscara, el texto abajo sobre azul, todo en la primera pantalla. Los puntos quedan y las flechas se ocultan; se cambia de diapositiva deslizando.

### 1.4 Frase introductoria (claro, marfil)
- Centrada, en Instrument Sans en mayúsculas espaciadas, 20 a 24 px, dos líneas como máximo, con líneas doradas finas a ambos lados en desktop.
- Texto editable desde los datos. En demo: "Obra contemporánea que dialoga con el espacio, el cuerpo y sus huellas."

### 1.5 Serie destacada (banda azul con textura, dentro del contenedor)
- A la izquierda, alrededor del 60 %: la portada de la serie. Puede recortarse con su punto de interés porque es una portada, y su borde derecho se funde con el azul como en el hero.
- A la derecha:
  - etiqueta "SERIE DESTACADA" en dorado
  - nombre de la serie en Cormorant grande
  - descripción breve
  - año o período y cantidad de obras, si existen
  - botón "Ver serie →"
- Sale de la serie marcada como "Serie principal del Inicio". No mostrar "Serie del mes".
- Demo: "Serie de ejemplo" con el texto "Serie de demostración. El título y las obras se confirman con la artista."

### 1.6 Series destacadas (claro)
- Título "SERIES DESTACADAS" con línea dorada y "VER TODAS LAS SERIES →" a la derecha.
- Tres tarjetas en fila. Cada una muestra:
  - la portada (recorte con punto de interés, proporción 16:10) con un degradado oscuro discreto en el tercio inferior
  - sobre ese degradado, el nombre en Instrument Sans en mayúsculas espaciadas y, debajo, "disciplina · técnica general" en etiqueta
  - un círculo fino con flecha a la derecha
- Hover: la imagen hace un zoom de 1.03 y el círculo se llena de dorado.
- Con menos de tres series, se muestran las que haya, sin huecos.
- Demo: la serie de ejemplo y, como máximo, otras dos series de ejemplo con las obras reales disponibles, nombradas "Serie de ejemplo B" y "Serie de ejemplo C". Nunca nombres inventados que parezcan reales.

### 1.7 Audiovisual y Obras sobre papel (dos bloques lado a lado, 52/48)
- **Audiovisual** (azul): fotograma real del video más reciente (portada de Vimeo) o, si no hay, celia-proceso-cine. Se funde con el azul hacia la izquierda. Lleva:
  - título "AUDIOVISUAL"
  - texto breve
  - botón "Ver audiovisual →"
  - un botón de reproducir circular fino sobre la imagen, que abre el modal del video actual
- **Obras sobre papel** (marfil): imagen real de un dibujo (celia-allkun) o de la disciplina cuando tenga obras. Lleva título, texto breve ("Dibujos, registros y piezas de pequeño formato.") y "Explorar →" a /obras/obras-sobre-papel.

### 1.8 Sobre la artista (claro)
- A la izquierda, una foto auténtica de Celia (celia-taller) fundida con el fondo hacia la derecha.
- A la derecha:
  - "SOBRE LA ARTISTA" con línea dorada
  - la bio corta de docs/contenido-sobre-la-artista.md
  - "Conocer más →" a /sobre-mi

### 1.9 Contacto (marfil, separado por línea fina)
- A la izquierda, "CONTACTO" con línea dorada y "Consultas sobre obra, adquisiciones, proyectos o exhibiciones."
- A la derecha, el formulario en una fila en desktop (nombre, email, mensaje) y el botón "Enviar →" relleno en azul medio.
- Reutilizar Formulario.jsx con Web3Forms, incluido su comportamiento sin clave.

### 1.10 Footer (azul profundo con textura)
- Firma en blanco cálido, email solo si está configurado, íconos lineales de Instagram y Vimeo, "CELIAGOMEZPEREA.COM" y "© 2026 Celia Gómez Perea".

### 1.11 Datos de demo y funciones
- En demo.js, agregar con la misma forma que tendrán en Sanity:
  - diapositivas del hero
  - frase del Inicio
  - disciplinas (Pinturas, Obras sobre papel)
  - series de ejemplo
  - la referencia de serie en las obras
- En sanity.js, agregar funciones para:
  - diapositivas activas del hero
  - frase del Inicio
  - serie principal
  - series destacadas
  - disciplinas del menú
  - video más reciente

  En esta etapa devuelven los datos de demo. Las consultas GROQ reales se escriben en la Etapa 2.
- Procesar las fotos 09, 10 y 11 de public/demo/celia-originales/: recortarlas exactamente al borde de la tela y corregir la perspectiva solo en forma geométrica, sin rellenar ni generar nada. Generar las variantes WebP. Las fotos 12, 13 y 14 son de proceso y se procesan sin recortar.

### 1.12 Responsive (diseñarlo, no solo apilar)
- Breakpoints: 390, 768, 1024, 1280 y 1440 px.
- Series destacadas: en mobile, un carrusel táctil con la tarjeta siguiente asomando. En tablet, dos columnas.
- Audiovisual y Obras sobre papel, uno debajo del otro en mobile.
- Formulario en columna en mobile.
- Sin textos menores a 14 px, sin bloques de más de una pantalla de alto y sin scroll horizontal.

---

## Etapa 2 — Estructura artística y Sanity

Archivos: studio/schemaTypes/, studio/ (estructura del escritorio), src/lib/sanity.js.

### Documentos
- **Disciplina (nuevo):** nombre, slug, descripción, orden, mostrar en el menú (sí/no) y portada opcional.
- **Serie (nuevo):** nombre, slug, disciplina (referencia), portada con punto de interés, descripción conceptual (texto enriquecido simple), año o período, técnica general (opcional), orden, destacada (sí/no, máximo 3), serie principal del Inicio (sí/no, una sola) y publicada (sí/no).
- **Obra (existente, se amplía sin borrar nada):**
  - Se agregan:
    - serie (referencia, opcional)
    - disciplina (referencia, obligatoria)
    - orden dentro de la serie
    - precio (número, opcional)
    - mostrar precio (sí/no, por defecto no)
    - destacada (sí/no)
  - Disponibilidad: Disponible, Reservada, Vendida, No disponible para la venta, Sin especificar (por defecto).
  - Las imágenes adicionales siguen siendo los detalles.
  - Si hay un campo de categoría o de proyecto en texto libre, se oculta y se marca como obsoleto, sin borrarlo.
- **Proyecto audiovisual (existente):** se agregan slug, categoría y duración opcional (si faltan). Se conserva el enlace de Vimeo.
- **Diapositiva del hero (nuevo):** imagen con punto de interés, etiqueta, título, subtítulo, texto del botón, enlace (interno o externo), orden y activa (sí/no).
- **Artista (existente):** se agregan statement (texto enriquecido), lugar y año de nacimiento, frase del Inicio, CV en PDF (archivo opcional, se muestra solo si está cargado) y listas de trayectoria con ítems de año o rango, título opcional y detalle:
  - obrasExposiciones
  - premiosBecasResidencias
  - formacionAcademica
  - formacionMovimiento
  - charlasDocencia

  Los campos viejos de trayectoria se ocultan, sin borrarse.
- **Configuración (existente):** se conserva. Email, WhatsApp y redes solo se muestran si están cargados.

### Validaciones
- El slug es único entre obras y disciplinas (comparten la ruta /obras/[slug]).
- Solo una serie principal del Inicio y como máximo 3 series destacadas, con un mensaje claro en español.
- Sin límite de cantidad de obras.

### Studio
- Menú: Inicio (diapositivas del hero) · Series · Obras (agrupadas por disciplina) · Disciplinas · Audiovisual · Sobre la artista · Configuración.
- En las listas se ven la miniatura, el título y el estado.
- Descripciones de ayuda en español para alguien que no es técnico.

### Consultas GROQ en sanity.js
Las funciones de la Etapa 1 pasan a consultar Sanity, manteniendo la misma forma de datos que demo.js. Se agregan:
- series por disciplina
- una serie con sus obras ordenadas
- una obra con su serie y sus vecinas dentro de la serie
- obras por disciplina
- todas las series

Al terminar: avisar que hay que correr `npx sanity deploy` en /studio.

---

## Etapa 3 — Páginas internas

Todas sobre fondo claro, con el lenguaje de la Etapa 1. Reutilizar Galeria.jsx, FichaObra.astro, Visor.jsx y MasObras.astro donde sirvan.

- **/series (nueva):** encabezado editorial, filtro por disciplina (island) y una grilla asimétrica de series, con portada grande, nombre en Cormorant, año y "N obras".
- **/series/[slug] (nueva):**
  - Portada protagonista fundida con una banda azul corta.
  - Nombre en Cormorant grande, año o período, técnica general y texto conceptual con ancho de lectura.
  - Debajo, todas las obras en su orden, completas y en su proporción, con el título y el año debajo.
  - Al pie, la serie anterior y la siguiente.
- **/obras:** todas las obras individuales, con filtro por disciplina y serie. Se mantiene la grilla actual adaptada al nuevo estilo.
- **/obras/[slug] cuando es una disciplina:** descripción de la disciplina, sus series primero y "Otras obras" después. En Obras sobre papel, piezas más chicas con más aire, en presentación de hojas.
- **/obras/[slug] cuando es una obra (la ficha actual, adaptada):**
  - Imagen grande ampliable y miniaturas de detalles.
  - Ficha técnica en DM Sans: año, técnica, dimensiones, solo si existen.
  - Serie como enlace y disponibilidad.
  - Precio solo si "mostrar precio" está activo.
  - Botón "Consultar por esta obra" por WhatsApp, solo si está configurado.
  - Navegación "← Anterior · 2 / 4 · Siguiente →" dentro de la serie, también con teclado.
- **/audiovisual:** encabezado azul con textura y presentación más cinematográfica:
  - el video destacado a gran formato
  - una grilla de proyectos con portada real, título, año y descripción
  - reproductor de Vimeo en el modal actual, sin iframes al cargar
  - videos verticales en su proporción
- **/sobre-mi:** diseño editorial con el contenido de docs/contenido-sobre-la-artista.md tal cual, sin cambiar palabras:
  - encabezado con su foto
  - bio
  - statement con la frase destacada en Cormorant entre líneas doradas
  - trayectoria cronológica en bloques (obras y exposiciones; premios, becas y residencias; formación; charlas y docencia), con el año en una columna angosta y "Ver todo" para desplegar
  - botón "Descargar CV" solo si el PDF está cargado
- **/contacto:** el bloque de contacto del Inicio, más amplio, con Instagram, Vimeo y los datos configurados.

---

## Etapa 4 — Contenido real (en modo demo, hasta cargar Sanity)

- En demo.js:
  - Statement, bio y trayectoria completas desde docs/contenido-sobre-la-artista.md.
  - Videos verificados de Vimeo, con títulos corregidos y datos del CV:
    - https://vimeo.com/1106622793 ("Azul Patagonia")
    - "Del punto a la línea, un océano" (2025, Museo de Artes Visuales, Trelew)
    - "Tempo resonante" (2015)

    Nunca mostrar nombres de archivo de Vimeo.
  - Fotos procesadas de obras y de proceso asignadas a sus lugares, sin repetir una misma foto en una página.
- Lista de pendientes para pedirle a la artista: series reales y sus obras, fichas, disponibilidad y precios, nombre definitivo de "Obras sobre papel", cuarta disciplina, listado final de videos, datos de contacto autorizados y foto original de BUCEAR.

---

## Etapa 5 — Testing

Sin cambiar el diseño:
- **Responsive** en 390, 768, 1024, 1280, 1440 y 1920 px: sin scroll horizontal ni desbordes, y hero completo en la primera pantalla.
- **Carrusel:** teclado, deslizamiento, movimiento reducido, una sola diapositiva y LCP.
- **Navegación:** desplegable de Obra y menú mobile con teclado y touch, y foco visible.
- **Accesibilidad:** un solo h1 por página, alt en todas las imágenes y contraste según CLAUDE.md.
- **Imágenes:** ninguna se descarga más grande de lo que se muestra, ninguna obra deformada y lazy loading debajo del primer pantallazo.
- **Formulario:** con clave y sin clave.
- **Sanity:** el build pasa en modo demo y con credenciales, y el Studio se despliega.
- **Lanzamiento:** noindex activo hasta el lanzamiento y build limpio.
