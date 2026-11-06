import {defineField, defineType} from 'sanity'
import {esAdministrador, esUrlOpcional, esWhatsapp} from './validaciones.js'

export const configuracion = defineType({
  name: 'configuracion',
  title: 'Configuración',
  type: 'document',
  initialValue: {
    limiteObras: 30,
  },
  groups: [
    {name: 'contacto', title: 'Contacto', default: true},
    {name: 'inicio', title: 'Inicio'},
    {
      name: 'plan',
      title: 'Plan',
      hidden: ({currentUser}) => !esAdministrador(currentUser),
    },
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
      title: 'WhatsApp',
      type: 'string',
      group: 'contacto',
      description: 'El celular con código de país adelante. Ejemplo: +54 9 280 4123456.',
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
      description: 'La obra que querés mostrar grande en la página de inicio.',
    }),
    defineField({
      name: 'limiteObras',
      title: 'Límite de obras del plan',
      type: 'number',
      group: 'plan',
      initialValue: 30,
      description:
        'Cantidad máxima de obras que se pueden tener publicadas. Si se llega a este número, no se puede publicar una obra nueva.',
      hidden: ({currentUser}) => !esAdministrador(currentUser),
      validation: (rule) =>
        rule.required().integer().min(1).error('Indicá un número mayor a cero. El valor inicial es 30.'),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Configuración'}
    },
  },
})
