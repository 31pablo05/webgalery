# webgalery — web de la artista Celia Gómez Perea

Web de Celia Gómez Perea, artista visual de Trelew, Chubut (pintura, dibujo, instalación, performance, videoarte), con más de 20 años de trayectoria. Proyecto de MediaDesign. Concepto visual: **galería editorial oceánica**. Dominio final: celiagomezperea.com. Demo: webgalery-three.vercel.app.

Respondé siempre en español rioplatense.

## Stack (no se cambia)
- Astro + Tailwind CSS v4 + React Islands + Sanity CMS (Studio en /studio) + Vimeo + Vercel. JavaScript y JSX, no TypeScript.
- Sitio estático. Componentes en .astro; .jsx solo con estado o eventos (carrusel, filtros, visor, formulario).
- Sin datos en Sanity, todo sale de src/data/demo.js (modo demo). Las consultas viven en src/lib/sanity.js y devuelven la misma forma en modo demo y con Sanity.
- Estilos: Tailwind + variables CSS de src/styles/global.css. Sin estilos inline ni librerías nuevas sin consultar.

## Estructura y vocabulario (decisión del 10/11)
- Una **obra** tiene nombre (por ejemplo "Una vez vi blanco") y está formada por varios **cuadros** (4, 5 o los que sean). Cada cuadro tiene su propia ficha.
- En TODA la interfaz pública se habla de "obras" y "cuadros". La palabra "serie" no aparece en la web. Internamente los tipos de Sanity no se renombran (serie y obra): solo los títulos y descripciones del Studio ("serie" se muestra como "Obra" y "obra" como "Cuadro o pieza").
- Menú: INICIO · OBRAS · ILUSTRACIONES · AUDIOVISUAL · SOBRE LA ARTISTA · CONTACTO. Sin desplegable y sin "Series". Las secciones de obra salen de las disciplinas en los datos; una disciplina nueva aparece sola en el menú.
- "Ilustraciones" es nombre provisorio hasta que lo confirme la artista (reemplaza a "Obras sobre papel").
- Inicio: hero → frase → obra destacada con la tira de sus cuadros → tres accesos (Obras, Ilustraciones, Audiovisual) → sobre la artista → contacto.

## Cómo trabajar
- El plan está en docs/plan-rediseno.md, dividido en etapas. Hacé solo la etapa que te pida.
- Antes de editar, revisá los componentes existentes y reutilizá lo que sirva. No rehacer lo que funciona: Vimeo en modal, lightbox, formulario con Web3Forms, noindex, carga progresiva de imágenes, View Transitions.
- Las rutas existentes siguen funcionando: /, /obras, /obras/[slug], /ilustraciones, /audiovisual, /sobre-mi, /contacto. Las páginas de una obra con nombre (/obras/[obra]) y de sus cuadros se crean en la Etapa 3; hasta entonces sus enlaces llevan a /obras (src/lib/rutas.js).
- Al terminar una etapa: build, capturas a 1440 y 390 px de las páginas tocadas, lista de archivos modificados y por qué. Frenar hasta que valide.
- No hacer commits ni push.

## Reglas de contenido (estrictas)
- No inventar datos artísticos: títulos, series, años, técnicas, medidas, precios, premios, exposiciones, emails ni teléfonos. Lo que falte queda vacío, oculto o como "pendiente".
- Los textos de demostración de diseño (por ejemplo el título del hero) se cargan como contenido editable, nunca fijos en el código.
- Fuente del contenido biográfico: docs/contenido-sobre-la-artista.md (de su CV). Usarlo tal cual.
- Solo fotos reales de la artista y su obra. Nunca imágenes generadas con IA atribuidas a ella.
- Las obras no se alteran ni se usan como decoración o textura.
- En la página de una obra y en la ficha de un cuadro, los cuadros se ven completos, en su proporción real, sin texto encima. Solo las portadas de tarjetas pueden recortarse (con el punto de interés de Sanity).
- Sin afirmaciones absolutas ("la mejor artista…"). Su trayectoria se respalda con datos del CV.
- La venta es por consulta: sin carrito ni pagos. El precio solo se muestra si la artista lo carga y activa "Mostrar precio".
- Las fotos originales de public/demo/celia-originales/ no se publican (.gitignore): se procesan a WebP en public/demo/.

## Firma (logo)
- Archivo: src/assets/logo/logo-celia-gomez.svg (usa currentColor). Es la firma real de la artista, "celia gomez". Nunca redibujarla, completarla ("perea"), reemplazarla por una tipografía ni modificar sus trazos. La firma de las maquetas es una interpretación y no se copia.
- Se inserta como SVG en línea para que tome el color del fondo.

## Paleta
| Token | Valor | Uso |
|---|---|---|
| azul-oceano | #154560 | Hero, bandas destacadas, footer |
| azul-profundo | #12394F | Zonas más oscuras del hero y footer |
| azul-medio | #28617A | Botones rellenos, enlaces y acentos sobre claro |
| azul-suave | #719DAA | Detalles y decoración. No como texto chico |
| azul-bruma | #9BBCC6 | Texto secundario sobre azul (6:1) |
| blanco-calido | #FAF7F3 | Fondo general |
| marfil | #F2E9E0 | Fondo de bandas claras alternas |
| tinta | #191919 | Texto principal |
| dorado | #D4A14E | Líneas finas, ornamentos, íconos. Como texto solo sobre azul-profundo o en 24 px o más |
| dorado-oscuro | #8A6420 | Si hace falta texto dorado sobre fondo claro |
| gris | #666666 | Texto secundario sobre claro |

- Distribución: hero, obra destacada, audiovisual y footer en azul. Galerías, series, fichas y textos largos sobre blanco cálido o marfil. Las obras conservan sus colores.
- Contraste mínimo de 4.5:1 en texto chico y de 3:1 en texto de 24 px o más.

## Tipografía
- Cormorant Garamond (400, 500, itálica 400): titulares editoriales, hero, nombres de obras, frases destacadas.
- Instrument Sans (400, 500, 600): menú, títulos de sección, botones, etiquetas. Mayúsculas espaciadas solo en textos cortos.
- DM Sans (400, 500): descripciones, textos largos, fichas técnicas, biografía, formularios.

## Texturas
- Las texturas de las bandas azules son decorativas, sutiles y procedurales (pigmento y grano hechos con SVG o CSS), en tonos de la paleta.
- No se generan a partir de las obras de la artista ni con IA.
- Nunca van encima de una obra ni detrás de texto largo.
