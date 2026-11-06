import {defineField, defineType} from 'sanity'
import {campoImagen} from './imagen.js'
import {esLinkVimeo, maximoMarcados} from './validaciones.js'

const categorias = {
  videoensayo: 'Videoensayo',
  registro: 'Registro',
  proceso: 'Proceso',
  instalacion: 'Instalación',
}

export const proyectoAudiovisual = defineType({
  name: 'proyectoAudiovisual',
  title: 'Proyecto audiovisual',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      description: 'El nombre del proyecto, tal como querés que se vea en el sitio.',
      validation: (rule) => rule.required().error('Escribí el título del proyecto.'),
    }),
    defineField({
      name: 'anio',
      title: 'Año',
      type: 'number',
      description: 'El año del proyecto. Solo el número, por ejemplo 2024.',
      validation: (rule) =>
        rule.integer().min(1900).max(2100).error('Ingresá un año válido, por ejemplo 2024.'),
    }),
    defineField({
      name: 'duracion',
      title: 'Duración',
      type: 'string',
      description: 'Cuánto dura el video, escrito como se muestra. Ejemplo: 14:32.',
    }),
    defineField({
      name: 'descripcionCorta',
      title: 'Descripción corta',
      type: 'text',
      rows: 4,
      description: 'Un texto breve para presentar el proyecto.',
      validation: (rule) =>
        rule.max(420).error('Es un texto corto: dejalo en unas pocas líneas.'),
    }),
    defineField({
      name: 'linkVimeo',
      title: 'Link de Vimeo',
      type: 'url',
      description: 'Pegá el link completo del video. Tiene que ser de vimeo.com.',
      validation: (rule) => rule.required().custom(esLinkVimeo),
    }),
    campoImagen({
      name: 'miniatura',
      title: 'Miniatura',
      description:
        'Opcional. Es la foto de portada. Si no subís ninguna, en el sitio se usa la imagen de Vimeo.',
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría',
      type: 'string',
      description: 'El tipo de pieza. Elegí la opción que mejor la describe.',
      options: {
        layout: 'radio',
        list: [
          {title: 'Videoensayo', value: 'videoensayo'},
          {title: 'Registro', value: 'registro'},
          {title: 'Proceso', value: 'proceso'},
          {title: 'Instalación', value: 'instalacion'},
        ],
      },
      validation: (rule) => rule.required().error('Elegí una categoría.'),
    }),
    defineField({
      name: 'destacado',
      title: 'Proyecto destacado',
      type: 'boolean',
      description: 'Solo puede haber uno. Es el proyecto que se presenta como principal.',
      initialValue: false,
      validation: maximoMarcados(
        'proyectoAudiovisual',
        'destacado',
        1,
        'Ya hay un proyecto destacado. Desmarcá el otro para destacar este.',
      ),
    }),
    defineField({
      name: 'mostrarEnInicio',
      title: 'Mostrar en inicio',
      type: 'boolean',
      description: 'Si lo marcás, el proyecto aparece en la página de inicio. Podés mostrar hasta 2.',
      initialValue: false,
      validation: maximoMarcados(
        'proyectoAudiovisual',
        'mostrarEnInicio',
        2,
        'Ya hay 2 proyectos en el inicio. Desmarcá uno para mostrar este.',
      ),
    }),
  ],
  preview: {
    select: {
      title: 'titulo',
      media: 'miniatura',
      anio: 'anio',
      categoria: 'categoria',
    },
    prepare({title, media, anio, categoria}) {
      const partes = [categorias[categoria], anio].filter(Boolean)
      return {
        title: title || 'Sin título',
        media,
        subtitle: partes.join(' · '),
      }
    },
  },
})
