import {defineArrayMember} from 'sanity'

// Texto enriquecido simple: párrafos y negrita. Sin títulos ni enlaces, para que sea fácil de editar.
export const textoEnriquecido = defineArrayMember({
  type: 'block',
  styles: [{title: 'Párrafo', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [{title: 'Negrita', value: 'strong'}],
    annotations: [],
  },
})
