import {defineField, defineType} from 'sanity'
import {campoImagen} from './imagen.js'
import {slugUnico} from './validaciones.js'

export const disciplina = defineType({
  name: 'disciplina',
  title: 'Disciplina',
  type: 'document',
  fields: [
    defineField({
      name: 'nombre',
      title: 'Nombre',
      type: 'string',
      description: 'El nombre de la disciplina, tal como va a verse en el menú. Ejemplo: Pinturas.',
      validation: (rule) => rule.required().error('Escribí el nombre de la disciplina.'),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección de la página',
      type: 'slug',
      description:
        'Se arma sola a partir del nombre. Comparte la ruta con las obras (/obras/…). No puede repetir la dirección de una obra. Tocá “Generar”.',
      options: {source: 'nombre', maxLength: 96},
      validation: (rule) =>
        slugUnico(
          rule.required().error('Generá la dirección a partir del nombre.'),
          ['obra', 'disciplina'],
          'Esa dirección ya la usa una obra o otra disciplina. Elegí otra: las dos comparten /obras/.',
        ),
    }),
    defineField({
      name: 'descripcion',
      title: 'Descripción',
      type: 'text',
      rows: 4,
      description: 'Un texto breve para presentar la disciplina. Si todavía no está, dejalo vacío.',
    }),
    campoImagen({
      name: 'portada',
      title: 'Portada',
      description: 'Opcional. La foto de la disciplina en el inicio o en su página. Si no hay, el sitio muestra el espacio pendiente.',
    }),
    defineField({
      name: 'orden',
      title: 'Orden',
      type: 'number',
      description: 'Un número para ordenar el menú. El más bajo aparece primero. Conviene usar 10, 20, 30.',
      initialValue: 10,
      validation: (rule) => rule.integer().min(0).error('Usá un número entero, por ejemplo 10.'),
    }),
    defineField({
      name: 'mostrarEnMenu',
      title: 'Mostrar en navegación',
      type: 'boolean',
      description: 'Si está activo, la disciplina aparece en el menú Obra.',
      initialValue: true,
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
    select: {title: 'nombre', media: 'portada', menu: 'mostrarEnMenu'},
    prepare({title, media, menu}) {
      return {
        title: title || 'Sin nombre',
        media,
        subtitle: menu === false ? 'Oculta en el menú' : 'En el menú',
      }
    },
  },
})
