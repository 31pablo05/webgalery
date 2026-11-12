import {defineField, defineType} from 'sanity'
import {textoEnriquecido} from './bloques.js'
import {campoImagen} from './imagen.js'
import {maximoMarcados, slugUnico} from './validaciones.js'

export const serie = defineType({
  name: 'serie',
  title: 'Serie',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      description: 'El nombre real de la serie, tal como lo usa la artista.',
      validation: (rule) => rule.required().error('Escribí el nombre de la serie.'),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección de la página',
      type: 'slug',
      description: 'Se arma sola a partir del nombre y forma el link /series/…. Tocá “Generar”.',
      options: {source: 'nombre', maxLength: 96},
      validation: (rule) =>
        slugUnico(
          rule.required().error('Generá la dirección a partir del nombre.'),
          ['serie'],
          'Ya hay otra serie con esa dirección. Elegí otra.',
        ),
    }),
    defineField({
      name: 'disciplina',
      title: 'Disciplina',
      type: 'reference',
      to: [{type: 'disciplina'}],
      description: 'Opcional. Vinculala solo cuando la serie pertenezca con claridad a una disciplina.',
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción conceptual',
      type: 'array',
      of: [textoEnriquecido],
      description: 'El texto de la serie, en pocas líneas. Si todavía no está escrito, dejalo vacío.',
    }),
    defineField({
      name: 'anio',
      title: 'Año o período',
      type: 'string',
      description: 'Solo si está confirmado. Puede ser un año (2008) o un período (2007–2008). Si hay dudas, dejalo vacío.',
    }),
    defineField({
      name: 'tecnicaGeneral',
      title: 'Técnica general',
      type: 'string',
      description: 'Opcional. Una técnica que describa la serie en conjunto, no la de un cuadro suelto.',
    }),
    campoImagen({
      name: 'portada',
      title: 'Imagen de portada',
      description:
        'Opcional. Una foto de la serie. No uses una obra de otra serie. Si no hay foto, el sitio muestra el espacio pendiente.',
    }),
    defineField({
      name: 'publicada',
      title: 'Publicada',
      type: 'boolean',
      description: 'Si no la marcás, la serie queda guardada y no se ve en el sitio.',
      initialValue: false,
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      type: 'number',
      description: 'Un número para ordenar las series. El más bajo aparece primero. Conviene usar 10, 20, 30.',
      initialValue: 10,
      validation: (rule) => rule.integer().min(0).error('Usá un número entero, por ejemplo 10.'),
    }),
    defineField({
      name: 'destacada',
      title: 'Destacada en Inicio',
      type: 'boolean',
      description: 'Si la marcás, puede aparecer entre las series del inicio. Podés destacar hasta 3.',
      initialValue: false,
      validation: maximoMarcados(
        'serie',
        'destacada',
        3,
        'Ya hay 3 series destacadas. Desmarcá una para poder marcar esta.',
      ),
    }),
    defineField({
      name: 'principalInicio',
      title: 'Serie principal del Inicio',
      type: 'boolean',
      description: 'La serie grande del inicio. Solo puede haber una.',
      initialValue: false,
      validation: maximoMarcados(
        'serie',
        'principalInicio',
        1,
        'Ya hay una serie principal del inicio. Desmarcá la otra para elegir esta.',
      ),
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
    select: {
      title: 'nombre',
      media: 'portada',
      publicada: 'publicada',
      principal: 'principalInicio',
      anio: 'anio',
    },
    prepare({title, media, publicada, principal, anio}) {
      const estado = publicada ? 'Publicada' : 'Borrador'
      const partes = [estado, principal ? 'Principal del inicio' : '', anio].filter(Boolean)
      return {title: title || 'Sin nombre', media, subtitle: partes.join(' · ')}
    },
  },
})
