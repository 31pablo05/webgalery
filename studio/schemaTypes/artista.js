import {defineArrayMember, defineField, defineType} from 'sanity'
import {campoImagen} from './imagen.js'

function listaDeItems(name, title, description) {
  return defineField({
    name,
    title,
    type: 'array',
    group: 'recorrido',
    description,
    of: [{type: 'string'}],
  })
}

const textoEnriquecido = defineArrayMember({
  type: 'block',
  styles: [{title: 'Párrafo', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [{title: 'Negrita', value: 'strong'}],
    annotations: [],
  },
})

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
          description: 'La foto de fondo o principal de la primera pantalla.',
        }),
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
      name: 'bioCompleta',
      title: 'Bio completa',
      type: 'array',
      group: 'bio',
      description: 'El texto largo de Sobre mí. Podés separar párrafos y marcar palabras en negrita.',
      of: [textoEnriquecido],
    }),
    listaDeItems(
      'trayectoria',
      'Trayectoria',
      'Agregá un ítem por cada hito, en una frase corta. Si es un solo párrafo, alcanza con un ítem.',
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
