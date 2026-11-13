import {defineField, defineType} from 'sanity'
import {campoImagen} from './imagen.js'

// Una pantalla del carrusel del inicio: solo el fondo (foto o video).
// El texto del hero es fijo y se edita en "La artista" → "Hero del inicio".
export const diapositivaHero = defineType({
  name: 'diapositivaHero',
  title: 'Diapositiva del inicio',
  type: 'document',
  fields: [
    defineField({
      name: 'tipo',
      title: 'Tipo',
      type: 'string',
      options: {
        list: [
          {title: 'Fotografía', value: 'imagen'},
          {title: 'Video corto', value: 'video'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'imagen',
    }),
    campoImagen({
      name: 'imagen',
      title: 'Fotografía (o portada del video)',
      description:
        'Horizontal, de 1920 × 1080 px o más. Si es un video, subí acá su primer fotograma: se ve mientras el video carga. Sin imagen, la diapositiva no se publica.',
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'file',
      options: {accept: 'video/mp4'},
      description: 'MP4 horizontal de 1920 × 1080, de 5 a 10 segundos, sin audio y de menos de 4 MB.',
      hidden: ({parent}) => parent?.tipo !== 'video',
    }),
    defineField({
      name: 'epigrafe',
      title: 'Epígrafe',
      type: 'string',
      description: 'Opcional. Una línea chica abajo a la izquierda. Ejemplo: BUCEAR · Instalación, MAV Trelew.',
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
    select: {tipo: 'tipo', epigrafe: 'epigrafe', media: 'imagen', activa: 'activa', orden: 'orden'},
    prepare({tipo, epigrafe, media, activa, orden}) {
      return {
        title: epigrafe || (tipo === 'video' ? 'Video' : 'Fotografía'),
        media,
        subtitle: [tipo === 'video' ? 'Video' : 'Foto', activa ? 'Activa' : 'Inactiva', orden != null ? `Orden ${orden}` : '']
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
