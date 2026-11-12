import {defineField, defineType} from 'sanity'
import {campoImagen, imagenEnLista} from './imagen.js'
import {maximoMarcados, slugUnico} from './validaciones.js'

// categoria y proyecto (texto libre) se conservan y quedan ocultos: los reemplazan
// la disciplina y los documentos de proyecto artístico. No se borran los valores ya cargados.
const estados = {
  'sin-especificar': 'Sin especificar',
  disponible: 'Disponible',
  reservada: 'Reservada',
  vendida: 'Vendida',
  'no-disponible': 'No disponible para la venta',
}

export const obra = defineType({
  name: 'obra',
  title: 'Obra',
  type: 'document',
  groups: [
    {name: 'datos', title: 'Datos', default: true},
    {name: 'imagenes', title: 'Fotografías'},
    {name: 'venta', title: 'Venta'},
  ],
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      group: 'datos',
      description:
        'El nombre de la obra. Si todavía no está confirmado, podés escribir “Obra sin título confirmado” y guardarla sin publicarla.',
      validation: (rule) => rule.required().error('Escribí el título de la obra.'),
    }),
    defineField({
      name: 'slug',
      title: 'Dirección de la página',
      type: 'slug',
      group: 'datos',
      description:
        'Se arma sola a partir del título y forma el link, por ejemplo /obras/territorio. Tocá “Generar”. No puede repetir la dirección de una disciplina. Si la obra ya está publicada, no la cambies.',
      options: {source: 'titulo', maxLength: 96},
      validation: (rule) =>
        slugUnico(
          rule.required().error('Generá la dirección a partir del título.'),
          ['obra', 'disciplina'],
          'Esa dirección ya la usa otra obra o una disciplina. Elegí otra: las dos comparten /obras/.',
        ),
    }),
    defineField({
      name: 'publicada',
      title: 'Publicada',
      type: 'boolean',
      group: 'datos',
      description: 'Si no la marcás, la obra queda guardada como borrador y no se ve en el sitio.',
      initialValue: false,
    }),
    defineField({
      name: 'disciplina',
      title: 'Disciplina',
      type: 'reference',
      group: 'datos',
      to: [{type: 'disciplina'}],
      description: 'Opcional hasta que esté confirmada. Se elige de las disciplinas cargadas en el panel.',
    }),
    defineField({
      name: 'serie',
      title: 'Serie',
      type: 'reference',
      group: 'datos',
      to: [{type: 'serie'}],
      description: 'Opcional. Vinculala solo si la obra pertenece a esa serie. No la asignes por parecido visual.',
    }),
    defineField({
      name: 'ordenEnSerie',
      title: 'Orden dentro de la serie',
      type: 'number',
      group: 'datos',
      description: 'Solo si tiene serie. El número más bajo aparece primero. Conviene usar 10, 20, 30.',
      validation: (rule) => rule.integer().min(0).error('Usá un número entero, por ejemplo 10.'),
    }),
    defineField({
      name: 'anio',
      title: 'Año',
      type: 'number',
      group: 'datos',
      description: 'El año en que se hizo la obra, solo si está confirmado. Solo el número, por ejemplo 2024.',
      validation: (rule) =>
        rule.integer().min(1900).max(2100).error('Ingresá un año válido, por ejemplo 2024.'),
    }),
    defineField({
      name: 'tecnica',
      title: 'Técnica',
      type: 'string',
      group: 'datos',
      description: 'Cómo está hecha, solo si está confirmada. Ejemplo: Óleo sobre lienzo.',
    }),
    defineField({
      name: 'altoCm',
      title: 'Alto',
      type: 'number',
      group: 'datos',
      description: 'El alto en centímetros, solo si está confirmado. Es un dato aparte del texto que se muestra.',
      validation: (rule) => rule.positive().max(2000).error('Ingresá el alto en centímetros, por ejemplo 100.'),
    }),
    defineField({
      name: 'anchoCm',
      title: 'Ancho',
      type: 'number',
      group: 'datos',
      description: 'El ancho en centímetros, solo si está confirmado.',
      validation: (rule) => rule.positive().max(2000).error('Ingresá el ancho en centímetros, por ejemplo 80.'),
    }),
    defineField({
      name: 'dimensiones',
      title: 'Dimensiones mostradas',
      type: 'string',
      group: 'datos',
      description:
        'El texto que se ve en la ficha, solo si está confirmado. Ejemplo: 100 × 80 cm. Una serie puede reunir cuadros de distintas medidas.',
    }),
    defineField({
      name: 'estado',
      title: 'Disponibilidad',
      type: 'string',
      group: 'venta',
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
          {title: 'No disponible para la venta', value: 'no-disponible'},
        ],
      },
      validation: (rule) => rule.required().error('Elegí el estado de la obra.'),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoría (campo anterior)',
      type: 'string',
      group: 'datos',
      hidden: true,
      description:
        'Campo anterior, reemplazado por Disciplina. El valor cargado se conserva y no se borra. No lo uses para obras nuevas.',
      options: {
        layout: 'radio',
        list: [
          {title: 'Dibujo', value: 'dibujo'},
          {title: 'Instalación', value: 'instalacion'},
          {title: 'Experimentación gráfica', value: 'experimentacion-grafica'},
          {title: 'Obra bidimensional', value: 'obra-bidimensional'},
        ],
      },
    }),
    defineField({
      name: 'proyecto',
      title: 'Proyecto (campo anterior)',
      type: 'string',
      group: 'datos',
      hidden: true,
      description:
        'Campo anterior, en texto libre. Lo reemplazan Exposición, Performance, Instalación y Acción artística. El texto cargado se conserva.',
    }),
    campoImagen({
      name: 'imagenPrincipal',
      title: 'Fotografía principal',
      group: 'imagenes',
      description:
        'La foto que se ve en la galería y en la ficha. Podés guardar la obra sin foto: en el sitio se ve el espacio pendiente. Arrastrá el círculo para marcar la parte importante.',
    }),
    defineField({
      name: 'imagenesAdicionales',
      title: 'Fotografías adicionales',
      type: 'array',
      group: 'imagenes',
      description:
        'Otras fotos del mismo cuadro: un detalle, otro ángulo o la obra en la sala. No crean una obra nueva. Cargá las que hagan falta.',
      of: [imagenEnLista()],
    }),
    defineField({
      name: 'descripcionCorta',
      title: 'Descripción',
      type: 'text',
      rows: 4,
      group: 'datos',
      description: 'Un texto breve para la ficha. Si todavía no está, dejalo vacío.',
      validation: (rule) =>
        rule.max(420).error('Es un texto corto: dejalo en dos a cuatro líneas.'),
    }),
    defineField({
      name: 'precio',
      title: 'Precio',
      type: 'number',
      group: 'venta',
      description: 'Opcional. Solo el número, sin símbolos. No lo completes si la artista no lo definió.',
      validation: (rule) => rule.min(0).error('El precio no puede ser negativo.'),
    }),
    defineField({
      name: 'mostrarPrecio',
      title: 'Mostrar precio',
      type: 'boolean',
      group: 'venta',
      description: 'El precio solo se muestra en el sitio si esto está activo y hay un número cargado.',
      initialValue: false,
    }),
    defineField({
      name: 'destacadaEnInicio',
      title: 'Destacada',
      type: 'boolean',
      group: 'datos',
      description: 'Si la marcás, puede aparecer destacada. Podés destacar hasta 4 obras.',
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
      group: 'datos',
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
    {
      title: 'Orden en la serie',
      name: 'ordenEnSerieAsc',
      by: [{field: 'ordenEnSerie', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'titulo',
      media: 'imagenPrincipal',
      estado: 'estado',
      publicada: 'publicada',
    },
    prepare({title, media, estado, publicada}) {
      const partes = [publicada ? 'Publicada' : 'Borrador', estados[estado] || 'Sin estado']
      return {
        title: title || 'Sin título',
        media,
        subtitle: partes.join(' · '),
      }
    },
  },
})
