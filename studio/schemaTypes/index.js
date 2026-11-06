import {artista} from './artista.js'
import {configuracion} from './configuracion.js'
import {obra} from './obra.js'
import {proyectoAudiovisual} from './proyectoAudiovisual.js'

export const schemaTypes = [obra, proyectoAudiovisual, artista, configuracion]

export const tiposUnicos = new Set(['artista', 'configuracion'])
