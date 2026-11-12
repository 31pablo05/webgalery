import {defineField, defineType} from 'sanity'
import {campoImagen} from './imagen.js'

export const diapositivaHero = defineType({
  name: 'diapositivaHero',
  title: 'Diapositiva del inicio',
  type: 'document',
  fields: [
    campoImagen({
      name: 'imagen',
      title: 'Fotografía',
      description:
        'La foto de esta pantalla. Si es chica o horizontal, el sitio la muestra entera y no la estira. Sin foto, la diapositiva no se publica en el inicio.',
    }),
    defineField({
      name: 'etiqueta',
      title: 'Etiqueta',
      type: 'string',
      description: 'Opcional. Una línea corta encima del título.',
    }),
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      description: 'El título grande de la pantalla.',
    }),
    defineField({
      name: 'subtitulo',
      title: 'Subtítulo',
      type: 'text',
      rows: 2,
      description: 'Una frase breve debajo del título.',
    }),
    defineField({
      name: 'textoBoton',
      title: 'Texto del botón',
      type: 'string',
      description: 'El texto del botón. Ejemplo: Explorar obra.',
    }),
    defineField({
      name: 'enlace',
      title: 'Enlace',
      type: 'string',
      description: 'Una ruta del sitio, como /obras, o un link completo que empiece con https://.',
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      type: 'number',
      description: 'El número más bajo aparece primero. Conviene usar 10, 20, 30.',
      initialValue: 10,
      validation: (rule) => rule.integer().min(0).error('Usá un número entero, por ejemplo 10.'),
    }),
    defineField({
      name: 'activa',
      title: 'Activa',
      type: 'boolean',
      description: 'Si no la marcás, la diapositiva queda guardada y no entra en el inicio.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Orden',
      name: 'ordenAsc',
      by: [{field: 'orden', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'titulo', media: 'imagen', activa: 'activa', orden: 'orden'},
    prepare({title, media, activa, orden}) {
      return {
        title: title || 'Sin título',
        media,
        subtitle: [activa ? 'Activa' : 'Inactiva', orden != null ? `Orden ${orden}` : ''].filter(Boolean).join(' · '),
      }
    },
  },
})
