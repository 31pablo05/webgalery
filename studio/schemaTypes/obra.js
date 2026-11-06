import {defineField, defineType} from 'sanity'
import {campoImagen, imagenEnLista} from './imagen.js'
import {maximoMarcados} from './validaciones.js'

const estados = {
  'sin-especificar': 'Sin especificar',
  disponible: 'Disponible',
  reservada: 'Reservada',
  vendida: 'Vendida',
}

export const obra = defineType({
  name: 'obra',
  title: 'Obra',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      description: 'El nombre de la obra, tal como querés que aparezca en la galería.',
      validation: (rule) => rule.required().error('Escribí el título de la obra.'),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección de la página',
      type: 'slug',
      description:
        'Se arma sola a partir del título y forma el link, por ejemplo /obras/territorio. Tocá “Generar”. Si la obra ya está publicada, no la cambies: se romperían los links que ya se compartieron.',
      options: {source: 'titulo', maxLength: 96},
      validation: (rule) => rule.required().error('Generá la dirección a partir del título.'),
    }),
    defineField({
      name: 'anio',
      title: 'Año',
      type: 'number',
      description: 'El año en que se hizo la obra. Solo el número, por ejemplo 2024.',
      validation: (rule) =>
        rule.integer().min(1900).max(2100).error('Ingresá un año válido, por ejemplo 2024.'),
    }),
    defineField({
      name: 'tecnica',
      title: 'Técnica',
      type: 'string',
      description: 'Cómo está hecha. Ejemplo: Óleo sobre lienzo.',
    }),
    defineField({
      name: 'dimensiones',
      title: 'Dimensiones',
      type: 'string',
      description: 'Alto y ancho, como los querés mostrar. Ejemplo: 100 × 80 cm.',
    }),
    defineField({
      name: 'estado',
      title: 'Estado',
      type: 'string',
      description:
        'Dejalo en Sin especificar si no querés mostrar información comercial. Si elegís otro estado, se muestra en la ficha.',
      initialValue: 'sin-especificar',
      options: {
        layout: 'radio',
        list: [
          {title: 'Sin especificar', value: 'sin-especificar'},
          {title: 'Disponible', value: 'disponible'},
          {title: 'Reservada', value: 'reservada'},
          {title: 'Vendida', value: 'vendida'},
        ],
      },
      validation: (rule) => rule.required().error('Elegí el estado de la obra.'),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      description: 'Define en qué filtro de la galería aparece.',
      options: {
        layout: 'radio',
        list: [
          {title: 'Dibujo', value: 'dibujo'},
          {title: 'Obra bidimensional', value: 'obra-bidimensional'},
          {title: 'Experimentación gráfica', value: 'experimentacion-grafica'},
          {title: 'Intervención', value: 'intervencion'},
        ],
      },
      validation: (rule) => rule.required().error('Elegí una categoría.'),
    }),
    defineField({
      name: 'serie',
      title: 'Serie',
      type: 'string',
      description:
        'Opcional. Si esta obra pertenece a una serie, escribí el nombre. Ejemplo: Territorio en movimiento. Las obras con el mismo nombre se agrupan juntas.',
    }),
    campoImagen({
      name: 'imagenPrincipal',
      title: 'Imagen principal',
      description:
        'La foto que se ve en la galería y en la ficha. Podés arrastrar el círculo para marcar la parte importante de la imagen.',
      obligatoria: true,
    }),
    defineField({
      name: 'imagenesAdicionales',
      title: 'Imágenes adicionales',
      type: 'array',
      description: 'Hasta 3 fotos extra: un detalle, la obra en la sala u otro ángulo.',
      of: [imagenEnLista()],
      validation: (rule) => rule.max(3).error('Podés cargar hasta 3 imágenes adicionales.'),
    }),
    defineField({
      name: 'descripcionCorta',
      title: 'Descripción corta',
      type: 'text',
      rows: 4,
      description: 'Un texto breve, de dos a cuatro líneas, para la ficha de la obra.',
      validation: (rule) =>
        rule.max(420).error('Es un texto corto: dejalo en dos a cuatro líneas.'),
    }),
    defineField({
      name: 'destacadaEnInicio',
      title: 'Destacada en inicio',
      type: 'boolean',
      description: 'Si la marcás, puede aparecer en la página de inicio. Podés destacar hasta 4 obras.',
      initialValue: false,
      validation: maximoMarcados(
        'obra',
        'destacadaEnInicio',
        4,
        'Ya hay 4 obras destacadas en el inicio. Desmarcá una para poder marcar esta.',
      ),
    }),
    defineField({
      name: 'ordenGaleria',
      title: 'Orden en galería',
      type: 'number',
      description:
        'Un número para ordenar la galería a mano. El número más bajo aparece primero. Conviene usar 10, 20, 30 para poder intercalar obras después.',
      validation: (rule) => rule.integer().min(0).error('Usá un número entero, por ejemplo 10.'),
    }),
  ],
  orderings: [
    {
      title: 'Orden en galería',
      name: 'ordenGaleriaAsc',
      by: [{field: 'ordenGaleria', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'titulo',
      media: 'imagenPrincipal',
      estado: 'estado',
    },
    prepare({title, media, estado}) {
      return {
        title: title || 'Sin título',
        media,
        subtitle: estados[estado] || 'Sin estado',
      }
    },
  },
})
