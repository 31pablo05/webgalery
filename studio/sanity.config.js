import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {esESLocale} from '@sanity/locale-es-es'
import {schemaTypes, tiposUnicos} from './schemaTypes/index.js'
import {structure} from './structure.js'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET

if (!projectId || !dataset) {
  throw new Error(
    'Faltan SANITY_STUDIO_PROJECT_ID y SANITY_STUDIO_DATASET. Copiá studio/.env.example a studio/.env y completá los valores.',
  )
}

const accionesDeUnico = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'webgalery',
  title: 'Estudio',
  projectId,
  dataset,
  plugins: [esESLocale(), structureTool({structure})],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({schemaType}) => !tiposUnicos.has(schemaType)),
  },
  document: {
    actions: (input, context) => {
      if (!tiposUnicos.has(context.schemaType)) return input
      return input.filter(({action}) => action && accionesDeUnico.has(action))
    },
  },
})
