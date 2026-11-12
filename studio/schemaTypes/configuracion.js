import {defineField, defineType} from 'sanity'
import {esUrlOpcional, esWhatsapp} from './validaciones.js'

export const configuracion = defineType({
  name: 'configuracion',
  title: 'Configuración',
  type: 'document',
  groups: [
    {name: 'contacto', title: 'Contacto', default: true},
    {name: 'inicio', title: 'Inicio'},
  ],
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'contacto',
      description: 'El correo que se muestra en el pie y en contacto. Ejemplo: hola@estudio.com.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return true
          return 'Revisá el email. Tiene que verse como hola@estudio.com.'
        }),
    }),
    defineField({
      name: 'whatsapp',
      title: 'Teléfono de WhatsApp para consultas',
      type: 'string',
      group: 'contacto',
      description:
        'Opcional. El celular con código de país adelante, por ejemplo +54 9 280 4123456. Si lo dejás vacío, no aparece el botón de consulta en las obras ni el WhatsApp en contacto.',
      validation: (rule) => rule.custom(esWhatsapp),
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'url',
      group: 'contacto',
      description: 'El link completo del perfil. Si lo dejás vacío, el ícono no se muestra.',
      validation: (rule) => rule.custom(esUrlOpcional),
    }),
    defineField({
      name: 'vimeo',
      title: 'Vimeo',
      type: 'url',
      group: 'contacto',
      description: 'El link del perfil o canal de Vimeo. Si lo dejás vacío, el ícono no se muestra.',
      validation: (rule) => rule.custom(esUrlOpcional),
    }),
    defineField({
      name: 'youtube',
      title: 'YouTube',
      type: 'url',
      group: 'contacto',
      description: 'El link del canal de YouTube. Si lo dejás vacío, el ícono no se muestra.',
      validation: (rule) => rule.custom(esUrlOpcional),
    }),
    defineField({
      name: 'ciudad',
      title: 'Ciudad',
      type: 'string',
      group: 'contacto',
      description: 'La ciudad que se muestra junto al ícono de ubicación. Ejemplo: Trelew.',
    }),
    defineField({
      name: 'obraPrincipal',
      title: 'Obra principal de inicio',
      type: 'reference',
      group: 'inicio',
      to: [{type: 'obra'}],
      description:
        'Campo anterior. El inicio ahora elige la serie principal y las diapositivas. Si ya había una obra elegida, se conserva.',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Configuración'}
    },
  },
})
