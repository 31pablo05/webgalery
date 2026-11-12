import {defineField, defineType} from 'sanity'

// Ítem del recorrido. El año queda como texto para poder escribir un rango (2005–2007) sin inventar una fecha única.
export const hito = defineType({
  name: 'hito',
  title: 'Hito',
  type: 'object',
  fields: [
    defineField({
      name: 'periodo',
      title: 'Año o período',
      type: 'string',
      description: 'Como figura en el CV. Ejemplo: 2008, o 2005–2007. Si no está confirmado, dejalo vacío.',
    }),
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      description: 'El nombre de la muestra, el premio o el estudio.',
    }),
    defineField({
      name: 'detalle',
      title: 'Detalle',
      type: 'text',
      rows: 2,
      description: 'Lugar, institución u otra precisión confirmada.',
    }),
  ],
  preview: {
    select: {title: 'titulo', periodo: 'periodo', detalle: 'detalle'},
    prepare({title, periodo, detalle}) {
      return {
        title: title || detalle || 'Sin título',
        subtitle: periodo || '',
      }
    },
  },
})
