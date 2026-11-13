import {defineField, defineType} from 'sanity'
import {textoEnriquecido} from './bloques.js'
import {campoImagen} from './imagen.js'

function listaDeItems(name, title, description) {
  return defineField({
    name,
    title,
    type: 'array',
    group: 'recorridoAnterior',
    description,
    of: [{type: 'string'}],
  })
}

function listaDeHitos(name, title, description) {
  return defineField({
    name,
    title,
    type: 'array',
    group: 'recorrido',
    description,
    of: [{type: 'hito'}],
  })
}

export const artista = defineType({
  name: 'artista',
  title: 'Artista',
  type: 'document',
  initialValue: {
    subtitulo: 'Artista visual',
  },
  groups: [
    {name: 'datos', title: 'Datos', default: true},
    {name: 'inicio', title: 'Inicio'},
    {name: 'audiovisual', title: 'Audiovisual'},
    {name: 'bio', title: 'Biografía'},
    {name: 'recorrido', title: 'Recorrido'},
    {name: 'recorridoAnterior', title: 'Recorrido anterior'},
    {name: 'contacto', title: 'Contacto'},
  ],
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      group: 'datos',
      description: 'El nombre que aparece en el encabezado y en el pie del sitio.',
      validation: (rule) => rule.required().error('Escribí el nombre.'),
    }),
    defineField({
      name: 'subtitulo',
      title: 'Subtítulo',
      type: 'string',
      group: 'datos',
      description: 'La línea chica debajo del nombre. Por defecto: Artista visual.',
      initialValue: 'Artista visual',
    }),
    defineField({
      name: 'lugarNacimiento',
      title: 'Lugar de nacimiento',
      type: 'string',
      group: 'datos',
      description: 'Solo si está confirmado. Ejemplo: Chubut.',
    }),
    defineField({
      name: 'anioNacimiento',
      title: 'Año de nacimiento',
      type: 'number',
      group: 'datos',
      description: 'Solo el año, si está confirmado.',
      validation: (rule) => rule.integer().min(1900).max(2100).error('Ingresá un año válido.'),
    }),
    defineField({
      name: 'frase',
      title: 'Frase destacada',
      type: 'string',
      group: 'datos',
      description:
        'Una frase propia de la artista. Se muestra debajo del nombre en el inicio y en Sobre la artista. Ejemplo: Territorio arte.',
    }),
    defineField({
      name: 'heroInicio',
      title: 'Hero de inicio',
      type: 'object',
      group: 'inicio',
      description: 'El bloque grande de la primera pantalla. El título va en tres líneas.',
      fields: [
        defineField({
          name: 'linea1',
          title: 'Línea 1',
          type: 'string',
          description: 'Primera línea del título. Ejemplo: PINTURA',
        }),
        defineField({
          name: 'linea2',
          title: 'Línea 2',
          type: 'string',
          description: 'Segunda línea del título. Ejemplo: TERRITORIO',
        }),
        defineField({
          name: 'linea3',
          title: 'Línea 3',
          type: 'string',
          description: 'Tercera línea del título. Ejemplo: MEMORIA',
        }),
        defineField({
          name: 'bajada',
          title: 'Bajada',
          type: 'text',
          rows: 3,
          description: 'Una frase corta debajo del título.',
        }),
        campoImagen({
          name: 'imagen',
          title: 'Imagen',
          description: 'La foto de fondo o principal de la primera pantalla. Campo anterior: el inicio ahora usa las diapositivas.',
        }),
      ],
    }),
    defineField({
      name: 'fraseInicio',
      title: 'Frase del inicio',
      type: 'string',
      group: 'inicio',
      description: 'La frase breve entre el hero y la serie destacada. Es un texto editable, corto.',
    }),
    defineField({
      name: 'heroInicio',
      title: 'Hero del inicio',
      type: 'object',
      group: 'inicio',
      description: 'El texto que se lee sobre el carrusel del inicio. No cambia con las diapositivas.',
      fields: [
        defineField({name: 'etiqueta', title: 'Etiqueta', type: 'string', description: 'Línea chica arriba. Ejemplo: Artista visual · Patagonia argentina.'}),
        defineField({name: 'titulo', title: 'Título', type: 'string', description: 'El texto grande. Ejemplo: su nombre.'}),
        defineField({name: 'bajada', title: 'Bajada', type: 'text', rows: 2, description: 'Una o dos líneas debajo del título.'}),
        defineField({
          name: 'botonPrincipal',
          title: 'Botón principal',
          type: 'object',
          fields: [
            defineField({name: 'texto', title: 'Texto', type: 'string'}),
            defineField({name: 'enlace', title: 'Enlace', type: 'string', description: 'Ruta del sitio, como /series.'}),
          ],
        }),
        defineField({
          name: 'botonSecundario',
          title: 'Botón secundario',
          type: 'object',
          fields: [
            defineField({name: 'texto', title: 'Texto', type: 'string'}),
            defineField({name: 'enlace', title: 'Enlace', type: 'string', description: 'Ruta del sitio, como /contacto.'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'fragmentos',
      title: 'Fragmentos de obra',
      type: 'array',
      group: 'inicio',
      description:
        'Acercamientos reales a la superficie de un cuadro, con el borde de la tela. Se muestran a todo el ancho, sin texto encima ni filtros. Horizontales, de 2000 px de ancho o más.',
      of: [
        {
          type: 'object',
          name: 'fragmento',
          fields: [
            campoImagen({name: 'imagen', title: 'Foto del detalle'}),
            defineField({
              name: 'obra',
              title: 'Obra o serie',
              type: 'string',
              description: 'Opcional. Aparece debajo como "Detalle · nombre". Si queda vacío, dice "Detalle".',
            }),
            defineField({
              name: 'ubicacion',
              title: 'Dónde aparece',
              type: 'string',
              options: {
                list: [
                  {title: 'Inicio · después de la frase', value: 'inicio-1'},
                  {title: 'Inicio · antes de contacto', value: 'inicio-2'},
                ],
              },
            }),
          ],
          preview: {
            select: {title: 'obra', subtitle: 'ubicacion', media: 'imagen'},
            prepare: ({title, subtitle, media}) => ({title: title || 'Detalle', subtitle: subtitle || 'Sin ubicación', media}),
          },
        },
      ],
    }),
    defineField({
      name: 'heroAudiovisual',
      title: 'Hero de audiovisual',
      type: 'object',
      group: 'audiovisual',
      description: 'El encabezado de la página de proyectos audiovisuales.',
      fields: [
        defineField({
          name: 'bajada',
          title: 'Bajada',
          type: 'text',
          rows: 3,
          description: 'Una frase corta para presentar la página.',
        }),
        campoImagen({
          name: 'imagen',
          title: 'Imagen',
          description: 'La foto principal de esa página.',
        }),
      ],
    }),
    campoImagen({
      name: 'retrato',
      title: 'Retrato',
      group: 'bio',
      description: 'Una foto de la artista para la página de presentación.',
    }),
    defineField({
      name: 'bioCorta',
      title: 'Bio corta',
      type: 'text',
      rows: 4,
      group: 'bio',
      description: 'Se muestra en el inicio. Con dos o tres frases alcanza.',
    }),
    defineField({
      name: 'fraseStatement',
      title: 'Frase del statement',
      type: 'text',
      rows: 3,
      group: 'bio',
      description: 'La frase que se muestra destacada arriba del statement. Usá una oración que ya esté en el texto.',
    }),
    defineField({
      name: 'statement',
      title: 'Statement',
      type: 'array',
      group: 'bio',
      of: [textoEnriquecido],
      description: 'El texto en primera persona, si la artista lo aprueba. Si hay dudas de redacción, dejalo vacío.',
    }),
    defineField({
      name: 'bioCompleta',
      title: 'Bio completa',
      type: 'array',
      group: 'bio',
      description: 'El texto largo de Sobre mí. Podés separar párrafos y marcar palabras en negrita.',
      of: [textoEnriquecido],
    }),
    listaDeHitos(
      'obrasExposiciones',
      'Obras y exposiciones',
      'Una muestra o una obra por ítem. Cargá solo lo que esté confirmado en el CV.',
    ),
    listaDeHitos(
      'premiosBecasResidencias',
      'Premios, becas y residencias',
      'Un premio, beca o residencia por ítem.',
    ),
    listaDeHitos(
      'formacionAcademica',
      'Formación académica',
      'Estudios formales. Un ítem por título o carrera.',
    ),
    listaDeHitos(
      'formacionMovimiento',
      'Formación en movimiento',
      'Estudios de cuerpo o movimiento, si están confirmados.',
    ),
    listaDeHitos(
      'charlasDocencia',
      'Charlas y docencia',
      'Una charla, taller o cargo docente por ítem.',
    ),
    listaDeItems(
      'trayectoria',
      'Trayectoria (campo anterior)',
      'Campo anterior, en una sola frase por ítem. El texto cargado se conserva. Para datos nuevos usá el recorrido de arriba.',
    ),
    listaDeItems(
      'exposiciones',
      'Exposiciones',
      'Una exposición por ítem. Ejemplo: 2024 — Museo Provincial, Trelew.',
    ),
    listaDeItems(
      'residencias',
      'Residencias',
      'Una residencia por ítem, con el año y el lugar si los tenés.',
    ),
    listaDeItems(
      'publicaciones',
      'Publicaciones',
      'Una publicación por ítem: título, medio y año.',
    ),
    defineField({
      name: 'cv',
      title: 'CV completo (PDF)',
      type: 'file',
      group: 'recorrido',
      description: 'Opcional. El archivo PDF que se puede descargar desde el sitio.',
      options: {accept: 'application/pdf'},
    }),
    campoImagen({
      name: 'fotoTaller',
      title: 'Foto del taller',
      group: 'contacto',
      description: 'La imagen de la sección de contacto.',
    }),
  ],
  preview: {
    select: {title: 'nombre', media: 'retrato'},
    prepare({title, media}) {
      return {title: title || 'Sobre la artista', media}
    },
  },
})
