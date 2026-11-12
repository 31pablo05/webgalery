import {accion, exposicion, instalacion, performance} from './proyectos.js'
import {artista} from './artista.js'
import {configuracion} from './configuracion.js'
import {diapositivaHero} from './diapositivaHero.js'
import {disciplina} from './disciplina.js'
import {hito} from './hito.js'
import {obra} from './obra.js'
import {proyectoAudiovisual} from './proyectoAudiovisual.js'
import {serie} from './serie.js'

export const schemaTypes = [
  obra,
  serie,
  disciplina,
  diapositivaHero,
  exposicion,
  performance,
  instalacion,
  accion,
  proyectoAudiovisual,
  artista,
  configuracion,
  hito,
]

export const tiposUnicos = new Set(['artista', 'configuracion'])
