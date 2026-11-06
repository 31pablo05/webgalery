const API_VERSION = '2026-11-05'

const CAMPOS_MARCADOS = new Set(['destacadaEnInicio', 'destacado', 'mostrarEnInicio'])

function idPublicado(context) {
  return (context.document?._id || '').replace(/^drafts\./, '')
}

export async function contarOtrosMarcados(context, type, field) {
  if (!CAMPOS_MARCADOS.has(field)) return 0

  const id = idPublicado(context)
  if (!id) return 0

  const client = context.getClient({apiVersion: API_VERSION})
  const ids = await client.fetch(
    `*[_type == $type && ${field} == true && !(_id in [$id, $draftId])]._id`,
    {type, id, draftId: `drafts.${id}`},
    {perspective: 'raw', signal: context.signal},
  )

  return new Set(ids.map((value) => String(value).replace(/^drafts\./, ''))).size
}

export function maximoMarcados(type, field, maximo, mensaje) {
  return (rule) =>
    rule.custom(async (value, context) => {
      if (!value) return true
      const cantidad = await contarOtrosMarcados(context, type, field)
      if (cantidad >= maximo) return mensaje
      return true
    })
}

export function esAdministrador(currentUser) {
  return Boolean(currentUser?.roles?.some((role) => role.name === 'administrator'))
}

export function esLinkVimeo(value) {
  if (!value) return 'Pegá el link del video en Vimeo.'

  let url
  try {
    url = new URL(value)
  } catch {
    return 'Tiene que ser un link de vimeo.com.'
  }

  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') {
    return 'Tiene que ser un link de vimeo.com.'
  }

  return true
}

export function esUrlOpcional(value) {
  if (!value) return true

  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return true
  } catch {
    // El mensaje de abajo cubre un link mal formado.
  }

  return 'Pegá el link completo, empezando con https://.'
}

export function esWhatsapp(value) {
  if (!value) return true

  const limpio = value.trim()
  if (!limpio.startsWith('+')) {
    return 'Empezá con el código de país. Ejemplo: +54 9 280 4123456.'
  }

  const digitos = limpio.replace(/\D/g, '')
  if (digitos.length < 8 || digitos.length > 15) {
    return 'Revisá el número: tiene que incluir el código de país y el celular.'
  }

  return true
}
