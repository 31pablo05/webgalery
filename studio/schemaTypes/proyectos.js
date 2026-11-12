import {defineField, defineType} from 'sanity'
import {textoEnriquecido} from './bloques.js'
import {campoImagen} from './imagen.js'
import {slugUnico} from './validaciones.js'

// Exposición, performance, instalación y acción son documentos distintos.
// No son una serie de cuadros y no se mezclan en un solo tipo.
const TIPOS_PROYECTO = ['exposicion', 'performance', 'instalacion', 'accion']

function camposDeProyecto(descripcionTipo) {
  return [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      description: 'El nombre real del proyecto, tal como lo usa la artista.',
      validation: (rule) => rule.required().error('Escribí el nombre.'),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección',
      type: 'slug',
      description: 'Se arma sola a partir del nombre. Tocá “Generar”.',
      options: {source: 'nombre', maxLength: 96},
      validation: (rule) =>
        slugUnico(
          rule.required().error('Generá la dirección a partir del nombre.'),
          TIPOS_PROYECTO,
          'Ya hay otro proyecto artístico con esa dirección. Elegí otra.',
        ),
    }),
    defineField({
      name: 'anio',
      title: 'Año o período',
      type: 'string',
      description: 'Solo si está confirmado. Si hay más de una fecha en el CV y no está claro cuál corresponde, dejalo vacío.',
    }),
    defineField({
      name: 'lugar',
      title: 'Lugar',
      type: 'string',
      description: 'Opcional. El espacio o la ciudad, si está confirmado.',
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'array',
      of: [textoEnriquecido],
      description: descripcionTipo,
    }),
    campoImagen({
      name: 'portada',
      title: 'Fotografía',
      description: 'Opcional. Una foto de este proyecto. Si no hay, el sitio muestra el espacio pendiente.',
    }),
    defineField({
      name: 'obras',
      title: 'Obras vinculadas',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'obra'}]}],
      description:
        'Solo las obras que confirmaste que forman parte. Si no está claro, dejalo vacío. No duplica las fotos de cada cuadro.',
    }),
    defineField({
      name: 'publicada',
      title: 'Publicada',
      type: 'boolean',
      description: 'Si no la marcás, el proyecto queda guardado y no se ve en el sitio.',
      initialValue: false,
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      type: 'number',
      description: 'Un número para ordenar. El más bajo aparece primero. Conviene usar 10, 20, 30.',
      initialValue: 10,
      validation: (rule) => rule.integer().min(0).error('Usá un número entero, por ejemplo 10.'),
    }),
  ]
}

function vistaPrevia() {
  return {
    select: {title: 'nombre', media: 'portada', publicada: 'publicada', anio: 'anio'},
    prepare({title, media, publicada, anio}) {
      return {
        title: title || 'Sin nombre',
        media,
        subtitle: [publicada ? 'Publicada' : 'Borrador', anio].filter(Boolean).join(' · '),
      }
    },
  }
}

export const exposicion = defineType({
  name: 'exposicion',
  title: 'Exposición',
  type: 'document',
  fields: camposDeProyecto('Una muestra en un espacio y un tiempo. No es una serie de cuadros.'),
  preview: vistaPrevia(),
})

export const performance = defineType({
  name: 'performance',
  title: 'Performance',
  type: 'document',
  fields: camposDeProyecto('Una acción en vivo. El registro en video, si existe, se carga en Audiovisual.'),
  preview: vistaPrevia(),
})

export const instalacion = defineType({
  name: 'instalacion',
  title: 'Instalación',
  type: 'document',
  fields: camposDeProyecto('Una obra que ocupa un espacio. No la conviertas en una serie si no es un conjunto de cuadros.'),
  preview: vistaPrevia(),
})

export const accion = defineType({
  name: 'accion',
  title: 'Acción artística',
  type: 'document',
  fields: camposDeProyecto('Una acción que no es una serie de cuadros ni una performance cargada aparte.'),
  preview: vistaPrevia(),
})
