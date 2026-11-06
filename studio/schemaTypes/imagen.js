import {defineField} from 'sanity'

export function campoImagen({name, title, description, obligatoria = false, group}) {
  return defineField({
    name,
    title,
    type: 'image',
    group,
    description,
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Texto alternativo',
        type: 'string',
        description:
          'Una frase que describe la foto, para quien no puede verla. Ejemplo: “Horizonte ocre sobre un campo gris”.',
      }),
    ],
    validation: (rule) =>
      rule.custom((value) => {
        const tieneArchivo = Boolean(value?.asset)
        if (!tieneArchivo) {
          return obligatoria ? 'Subí una imagen para poder publicar.' : true
        }
        if (!value?.alt?.trim()) {
          return 'Escribí un texto alternativo: una frase corta que describa la imagen.'
        }
        return true
      }),
  })
}

export function imagenEnLista() {
  return {
    type: 'image',
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Texto alternativo',
        type: 'string',
        description: 'Una frase que describe esta foto.',
      }),
    ],
    validation: (rule) =>
      rule.custom((value) => {
        if (!value?.asset) return true
        if (!value?.alt?.trim()) return 'Escribí un texto alternativo para esta foto.'
        return true
      }),
  }
}
