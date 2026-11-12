import {existsSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import * as demo from '../data/demo.js'
import {textoDePortable} from './texto.js'
import {resolverEnlace, rutaDisciplina, rutaSerie} from './rutas.js'

const API_VERSION = '2026-11-05'
const COLOR_SUPERFICIE = '#f2e9e0'
// Anchos de las variantes generadas para las imágenes de demo (archivo-400.webp, archivo-800.webp...).
const ANCHOS_DEMO = [400, 800, 1200]

function leerVite(nombre) {
  try {
    if (nombre === 'SANITY_PROJECT_ID') return import.meta.env.SANITY_PROJECT_ID || ''
    if (nombre === 'SANITY_DATASET') return import.meta.env.SANITY_DATASET || ''
  } catch {
    return ''
  }
  return ''
}

const projectId = (leerVite('SANITY_PROJECT_ID') || process.env?.SANITY_PROJECT_ID || '').trim()
const dataset = (leerVite('SANITY_DATASET') || process.env?.SANITY_DATASET || '').trim()
const enDemo = !projectId || !dataset

if (enDemo) {
  console.warn('Modo demo: usando datos de ejemplo')
}

export const client = enDemo
  ? null
  : createClient({
      projectId,
      dataset,
      apiVersion: API_VERSION,
      useCdn: true,
    })

const builder = enDemo ? null : createImageUrlBuilder(client)
const archivosDemo = new Map()

function datosDemo(source) {
  const ref = source?.asset?._ref || source?.asset?._id || ''
  const coincide = String(ref).match(/^image-demo-(.+)-(\d+)x(\d+)-([a-z0-9]+)$/)
  if (!coincide) return null
  return {
    nombre: coincide[1],
    extension: coincide[4],
    archivo: `${coincide[1]}.${coincide[4]}`,
    ancho: Number(coincide[2]),
    alto: Number(coincide[3]),
  }
}

let listadoDemo = null

function indexarDemo(carpeta, prefijo = '') {
  const mapa = new Map()
  let entradas = []
  try {
    entradas = readdirSync(carpeta, { withFileTypes: true })
  } catch {
    return mapa
  }
  for (const entrada of entradas) {
    if (entrada.name.startsWith('.') || entrada.name === 'celia-originales') continue
    const relativo = prefijo ? `${prefijo}/${entrada.name}` : entrada.name
    if (entrada.isDirectory()) {
      for (const [clave, valor] of indexarDemo(join(carpeta, entrada.name), relativo)) mapa.set(clave, valor)
      continue
    }
    mapa.set(relativo.toLowerCase(), relativo)
  }
  return mapa
}

function nombreReal(archivo) {
  if (!listadoDemo) listadoDemo = indexarDemo(join(process.cwd(), 'public', 'demo'))
  return listadoDemo.get(String(archivo).replaceAll('\\', '/').toLowerCase()) || ''
}

function archivoDemo(archivo) {
  if (!archivosDemo.has(archivo)) {
    const real = nombreReal(archivo)
    const ruta = real && join(process.cwd(), 'public', 'demo', real)
    archivosDemo.set(archivo, ruta && existsSync(ruta) ? `/demo/${encodeURI(real)}` : '')
  }
  return archivosDemo.get(archivo)
}

// Devuelve la variante más chica que cubre el ancho pedido y, si se recorta, también el alto
// (una imagen horizontal recortada en vertical necesita más ancho). Si no hay, el archivo completo.
function varianteDemo(datos, anchoPedido, altoPedido = 0) {
  const necesario = Math.max(anchoPedido, altoPedido > 0 ? (altoPedido * datos.ancho) / datos.alto : 0)
  if (necesario > 0) {
    let cercana = ''
    for (const ancho of ANCHOS_DEMO) {
      if (datos.ancho > 0 && ancho > datos.ancho * 1.35) continue
      const webp = archivoDemo(`${datos.nombre}-${ancho}.webp`)
      const variante = webp || archivoDemo(`${datos.nombre}-${ancho}.${datos.extension}`)
      if (!variante) continue
      cercana = variante
      if (ancho >= necesario) return variante
    }
    if (cercana) return cercana
  }
  const webp = datos.extension === 'webp' ? '' : archivoDemo(`${datos.nombre}.webp`)
  return webp || archivoDemo(datos.archivo)
}

function rectangulo(ancho, alto) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><rect width="100%" height="100%" fill="${COLOR_SUPERFICIE}"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function cadenaDemo(source) {
  const datos = datosDemo(source)
  let anchoPedido = 0
  let altoPedido = 0
  const cadena = {
    auto() {
      return cadena
    },
    width(valor) {
      anchoPedido = Number(valor) || anchoPedido
      return cadena
    },
    height(valor) {
      altoPedido = Number(valor) || altoPedido
      return cadena
    },
    url() {
      if (!datos) return ''
      const archivo = varianteDemo(datos, anchoPedido, altoPedido)
      if (archivo) return archivo
      const recorte = anchoPedido > 0 && altoPedido > 0
      return rectangulo(recorte ? anchoPedido : datos.ancho, recorte ? altoPedido : datos.alto)
    },
  }
  return cadena
}

export function urlFor(source) {
  if (enDemo) return cadenaDemo(source)
  return builder.image(source).auto('format')
}

// Una imagen está disponible si tiene archivo: en Sanity, un asset; en demo, el WebP procesado.
// Así una foto que todavía no se procesó se comporta igual que una imagen sin cargar en Sanity.
export function imagenDisponible(source) {
  if (!source?.asset) return false
  if (!enDemo) return true
  const datos = datosDemo(source)
  return Boolean(datos && datos.ancho > 0 && archivoDemo(datos.archivo))
}

function obrasDemo() {
  return demo.obras.filter((obra) => obra?.titulo && obra.publicada !== false)
}

// Píxeles reales de la imagen, si están en el archivo o en la referencia. Sin ellos, null:
// no se inventa una proporción a partir de una captura ni de un tamaño de pantalla.
export function relacionConfiable(imagen) {
  const ref = imagen?.asset?._id || imagen?.asset?._ref || ''
  const meta = imagen?.asset?.metadata?.dimensions
  const medida = String(ref).match(/-(\d+)x(\d+)-/)
  let ancho = Number(meta?.width) || (medida ? Number(medida[1]) : 0)
  let alto = Number(meta?.height) || (medida ? Number(medida[2]) : 0)
  if (!(ancho > 0) || !(alto > 0)) return null
  const recorte = imagen?.crop
  if (recorte) {
    ancho = Math.max(1, Math.round(ancho * (1 - (recorte.left || 0) - (recorte.right || 0))))
    alto = Math.max(1, Math.round(alto * (1 - (recorte.top || 0) - (recorte.bottom || 0))))
  }
  return { ancho, alto }
}

export async function fetchObras(filtro = '', params = {}) {
  if (enDemo) return obrasDemo()
  const publicadas = `*[_type == "obra" && ${VISIBLE}] | order(coalesce(ordenGaleria, 999999) asc)`
  const query = filtro ? `${publicadas}[${filtro}]` : publicadas
  return client.fetch(query, params)
}

// Una obra publicada: no es borrador de Sanity y no está marcada como no publicada.
// Si el campo todavía no existe en un documento viejo, se considera publicada.
const VISIBLE = `!(_id in path("drafts.**")) && coalesce(publicada, true) == true`

// Además de la referencia, trae medidas, la vista borrosa (LQIP) y el color dominante de cada imagen.
const metadatosImagen = `metadata {
    lqip,
    dimensions { width, height },
    palette { dominant { background } }
  }`

const imagen = `{
  alt,
  crop,
  hotspot,
  asset->{
    _id,
    ${metadatosImagen}
  }
}`

// En modo demo, la vista borrosa y el color dominante se generan durante el build con sharp.
function colorHex({r, g, b}) {
  return `#${[r, g, b].map((valor) => Math.round(valor).toString(16).padStart(2, '0')).join('')}`
}

async function completarImagenesDemo() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    return
  }
  const imagenes = []
  const visitar = (valor) => {
    if (!valor || typeof valor !== 'object') return
    if (Array.isArray(valor)) return valor.forEach(visitar)
    if (String(valor.asset?._ref || '').startsWith('image-demo-')) imagenes.push(valor)
    else Object.values(valor).forEach(visitar)
  }
  visitar([
    demo.obras,
    demo.artista,
    demo.configuracion,
    demo.series,
    demo.disciplinas,
    demo.diapositivasHero,
    demo.proyectosArtisticos,
  ])

  const calculados = new Map()
  await Promise.all(
    imagenes.map(async (imagenDemo) => {
      const datos = datosDemo(imagenDemo)
      const ruta = datos && join(process.cwd(), 'public', 'demo', datos.archivo)
      if (!ruta || !existsSync(ruta)) return
      if (!calculados.has(ruta)) {
        calculados.set(
          ruta,
          Promise.all([
            sharp(ruta).resize({width: 20}).webp({quality: 50}).toBuffer(),
            sharp(ruta).stats(),
          ]).then(([miniatura, stats]) => ({
            lqip: `data:image/webp;base64,${miniatura.toString('base64')}`,
            dominante: colorHex(stats.dominant),
          })),
        )
      }
      try {
        const {lqip, dominante} = await calculados.get(ruta)
        imagenDemo.asset.metadata = {
          ...imagenDemo.asset.metadata,
          lqip,
          palette: {dominant: {background: dominante}},
        }
      } catch {
        // Sin vista borrosa: la imagen se muestra sobre el color de superficie.
      }
    }),
  )
}

if (enDemo) await completarImagenesDemo()

// Videos de demo: título, portada, duración y descripción salen de Vimeo (oEmbed), nunca a mano.
function duracionVimeo(segundos) {
  const total = Math.round(Number(segundos) || 0)
  if (!total) return ''
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

let videosDemo = null
function proyectosDemo() {
  videosDemo ??= Promise.all(
    (demo.videosVimeo || []).map(async (link, indice) => {
      try {
        const respuesta = await fetch(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link)}&width=1920`,
        )
        if (!respuesta.ok) return null
        const datos = await respuesta.json()
        if (!datos.title) return null
        return {
          _id: `vimeo-${datos.video_id || indice}`,
          _type: 'proyectoAudiovisual',
          titulo: datos.title,
          anio: null,
          duracion: duracionVimeo(datos.duration),
          publicado: String(datos.upload_date || ''),
          descripcionCorta: String(datos.description || '').trim(),
          linkVimeo: link,
          categoria: '',
          ancho: Number(datos.width) || 0,
          alto: Number(datos.height) || 0,
          miniaturaUrl: datos.thumbnail_url || '',
        }
      } catch {
        return null
      }
    }),
  )
    // El más reciente primero (según la fecha de publicación que informa Vimeo).
    .then((lista) => lista.filter(Boolean).sort((a, b) => b.publicado.localeCompare(a.publicado)))
    .then((lista) => lista.map((video, indice) => ({...video, destacado: indice === 0, mostrarEnInicio: indice === 0})))
  return videosDemo
}

async function miniaturaVimeo(link, ancho = 960) {
  try {
    const respuesta = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(link)}&width=${ancho}`,
    )
    if (!respuesta.ok) return ''
    const datos = await respuesta.json()
    return datos.thumbnail_url || ''
  } catch {
    return ''
  }
}

async function conMiniatura(proyectos) {
  return Promise.all(
    (proyectos || []).map(async (proyecto) => {
      const miniaturaUrl = proyecto.miniatura?.asset
        ? urlFor(proyecto.miniatura).width(960).height(540).url()
        : proyecto.miniaturaUrl || (await miniaturaVimeo(proyecto.linkVimeo, 1920))
      return {...proyecto, miniaturaUrl}
    }),
  )
}

export async function fetchInicio() {
  if (enDemo) {
    const destacadas = obrasDemo()
      .filter((obra) => obra.destacadaEnInicio)
      .slice(0, 4)
      .map((obra) => ({
        titulo: obra.titulo,
        slug: obra.slug,
        anio: obra.anio,
        imagenPrincipal: obra.imagenPrincipal,
      }))
    const proyectos = (await proyectosDemo()).filter((proyecto) => proyecto.mostrarEnInicio).slice(0, 1)
    return {
      artista: demo.artista,
      configuracion: demo.configuracion,
      destacadas,
      audiovisual: await conMiniatura(proyectos),
    }
  }

  const [artista, configuracion, destacadas, proyectos] = await Promise.all([
    client.fetch(`*[_id == "artista"][0]{
      nombre,
      subtitulo,
      frase,
      bioCorta,
      heroInicio {
        linea1,
        linea2,
        linea3,
        bajada,
        imagen ${imagen}
      },
      heroAudiovisual {
        bajada,
        imagen ${imagen}
      },
      retrato ${imagen},
      fotoTaller ${imagen}
    }`),
    client.fetch(`*[_id == "configuracion"][0]{
      email,
      whatsapp,
      ciudad,
      instagram,
      vimeo,
      youtube,
      obraPrincipal->{
        titulo,
        anio,
        tecnica,
        dimensiones,
        estado,
        descripcionCorta,
        "slug": slug.current,
        imagenPrincipal ${imagen}
      }
    }`),
    client.fetch(
      `*[_type == "obra" && destacadaEnInicio == true && !(_id in path("drafts.**")) && coalesce(publicada, true) == true] | order(coalesce(ordenGaleria, 999999) asc) [0...4] {
        titulo,
        "slug": slug.current,
        anio,
        imagenPrincipal ${imagen}
      }`,
    ),
    client.fetch(`*[_type == "proyectoAudiovisual" && mostrarEnInicio == true && !(_id in path("drafts.**"))] | order(anio desc) [0...1] {
      titulo,
      anio,
      duracion,
      linkVimeo,
      miniatura ${imagen}
    }`),
  ])

  const audiovisual = await conMiniatura(proyectos)

  return {
    artista,
    configuracion,
    destacadas: destacadas || [],
    audiovisual,
  }
}

function proporcionObra(imagen, ref) {
  const meta = imagen?.asset?.metadata?.dimensions
  const medida = String(ref).match(/-(\d+)x(\d+)-/)
  let ancho = meta?.width || (medida ? Number(medida[1]) : 0)
  let alto = meta?.height || (medida ? Number(medida[2]) : 0)
  if (!ancho || !alto) return { ancho: 1280, alto: 1600 }

  const recorte = imagen.crop
  if (recorte) {
    ancho = Math.max(1, Math.round(ancho * (1 - (recorte.left || 0) - (recorte.right || 0))))
    alto = Math.max(1, Math.round(alto * (1 - (recorte.top || 0) - (recorte.bottom || 0))))
  }
  return { ancho, alto }
}

// Medidas reales de una imagen (respetando el recorte de Sanity), para mostrarla sin deformar.
export function medidasImagen(imagen) {
  const ref = imagen?.asset?._id || imagen?.asset?._ref || ''
  return proporcionObra(imagen, ref)
}

// Vista borrosa y color dominante de una imagen (los provee Sanity; en demo se generan en el build).
function cargaDe(imagen) {
  const metadata = imagen?.asset?.metadata
  return {
    lqip: metadata?.lqip || '',
    dominante: metadata?.palette?.dominant?.background || '',
  }
}

// srcset sin anchos inventados: ninguna versión se pide ni se declara más ancha que la imagen real
// (Sanity no agranda, y un descriptor mayor que el archivo achica la imagen en pantalla).
function versiones(source, anchoNatural, anchos) {
  const reales = [...new Set(anchos.map((ancho) => Math.min(ancho, anchoNatural)))]
  const lista = reales.map((ancho) => ({ ancho, url: urlFor(source).width(ancho).url() }))
  return {
    src: lista[lista.length - 1].url,
    srcset: lista.map(({ ancho, url }) => `${url} ${ancho}w`).join(', '),
    lista,
  }
}

function referenciaNombrada(valor, catalogo) {
  if (!valor) return null
  const slug = typeof valor === 'string' ? valor : valor.slug || ''
  if (!slug) return null
  const conocida = (catalogo || []).find((item) => item.slug === slug)
  const nombre = (typeof valor === 'object' && valor.nombre) || conocida?.nombre || ''
  return {nombre, slug}
}

function prepararObraGaleria(obra) {
  const imagen = obra.imagenPrincipal
  const ref = imagen?.asset?._id || imagen?.asset?._ref || ''
  const base = {
    titulo: obra.titulo || '',
    slug: obra.slug,
    anio: obra.anio ?? null,
    tecnica: obra.tecnica || '',
    dimensiones: obra.dimensiones || '',
    estado: obra.estado || '',
    categoria: obra.categoria || '',
    proyecto: (obra.proyecto || '').trim(),
    disciplina: referenciaNombrada(obra.disciplina, demo.disciplinas),
    serie: referenciaNombrada(obra.serie, demo.series),
    imagen: null,
    relacion: relacionConfiable(imagen),
  }
  if (!ref || !imagenDisponible(imagen)) return base

  const source = {
    alt: imagen.alt,
    crop: imagen.crop,
    hotspot: imagen.hotspot,
    asset: { _ref: ref },
  }
  const { ancho, alto } = proporcionObra(imagen, ref)
  const { src, srcset } = versiones(source, ancho, [640, 1280, 1920])
  return {
    ...base,
    imagen: {
      src,
      srcset,
      ancho,
      alto,
      alt: imagen.alt || obra.titulo || '',
      ...cargaDe(imagen),
    },
    relacion: { ancho, alto },
  }
}

export async function fetchGaleria() {
  if (enDemo) {
    const artista = demo.artista
    const configuracion = demo.configuracion
    const bajadaSanity = [artista?.bajadaGaleria, configuracion?.bajadaGaleria].find(
      (valor) => typeof valor === 'string' && valor.trim(),
    )
    return {
      artista,
      configuracion,
      bajada: bajadaSanity ? bajadaSanity.trim() : '',
      obras: obrasDemo()
        .filter((obra) => obra?.slug)
        .map(prepararObraGaleria),
    }
  }

  const [artista, configuracion, obras] = await Promise.all([
    client.fetch(`*[_id == "artista"][0]{
      nombre,
      subtitulo,
      bajadaGaleria
    }`),
    client.fetch(`*[_id == "configuracion"][0]{
      email,
      whatsapp,
      ciudad,
      instagram,
      vimeo,
      youtube,
      bajadaGaleria
    }`),
    client.fetch(
      `*[_type == "obra" && ${VISIBLE}] | order(coalesce(ordenGaleria, 999999) asc) {
        titulo,
        "slug": slug.current,
        anio,
        tecnica,
        dimensiones,
        estado,
        categoria,
        proyecto,
        "serie": serie->{ nombre, "slug": slug.current },
        "disciplina": disciplina->{ nombre, "slug": slug.current },
        imagenPrincipal {
          alt,
          crop,
          hotspot,
          asset->{
            _id,
            ${metadatosImagen}
          }
        }
      }`,
    ),
  ])

  const bajadaSanity = [artista?.bajadaGaleria, configuracion?.bajadaGaleria].find(
    (valor) => typeof valor === 'string' && valor.trim(),
  )

  return {
    artista,
    configuracion,
    bajada: bajadaSanity ? bajadaSanity.trim() : '',
    obras: (obras || []).filter((obra) => obra?.slug).map(prepararObraGaleria),
  }
}

function fuenteDe(imagen) {
  const ref = imagen?.asset?._id || imagen?.asset?._ref || ''
  if (!ref) return null
  const source = {
    alt: imagen.alt,
    crop: imagen.crop,
    hotspot: imagen.hotspot,
    asset: { _ref: ref },
  }
  const { ancho, alto } = proporcionObra(imagen, ref)
  return { source, ancho, alto, alt: imagen.alt || '' }
}

function fotoDetalle(imagen, titulo = '') {
  if (!imagenDisponible(imagen)) return null
  const fuente = fuenteDe(imagen)
  if (!fuente) return null
  const visor = versiones(fuente.source, fuente.ancho, [700, 1400])
  const ampliada = versiones(fuente.source, fuente.ancho, [1400, 2000])
  const thumbChica = urlFor(fuente.source).width(90).height(90).url()
  const thumb = urlFor(fuente.source).width(180).height(180).url()
  return {
    alt: fuente.alt || titulo || '',
    ancho: fuente.ancho,
    alto: fuente.alto,
    thumb,
    thumbSrcset: `${thumbChica} 90w, ${thumb} 180w`,
    src: visor.src,
    srcset: visor.srcset,
    lightbox: ampliada.src,
    lightboxSrcset: ampliada.srcset,
    ...cargaDe(imagen),
  }
}

function prepararObraDetalle(obra) {
  const fotos = [obra.imagenPrincipal, ...(obra.imagenesAdicionales || [])]
    .map((imagen) => fotoDetalle(imagen, obra.titulo))
    .filter(Boolean)
  return {
    titulo: obra.titulo || '',
    slug: obra.slug,
    anio: obra.anio ?? null,
    tecnica: obra.tecnica || '',
    dimensiones: obra.dimensiones || '',
    estado: obra.estado || '',
    categoria: obra.categoria || '',
    proyecto: (obra.proyecto || '').trim(),
    descripcionCorta: obra.descripcionCorta || '',
    imagenes: fotos,
    relacion: relacionConfiable(obra.imagenPrincipal),
    imagenPrincipal: imagenDisponible(obra.imagenPrincipal) ? obra.imagenPrincipal : null,
    serie: obra.serie?.slug ? {nombre: obra.serie.nombre || '', slug: obra.serie.slug} : null,
    ordenEnSerie: obra.ordenEnSerie ?? null,
    disciplina: obra.disciplina?.slug
      ? {nombre: obra.disciplina.nombre || '', slug: obra.disciplina.slug}
      : null,
    altoCm: Number(obra.altoCm) > 0 ? Number(obra.altoCm) : null,
    anchoCm: Number(obra.anchoCm) > 0 ? Number(obra.anchoCm) : null,
    precio: obra.mostrarPrecio && Number(obra.precio) >= 0 && obra.precio != null ? Number(obra.precio) : null,
    mostrarPrecio: obra.mostrarPrecio === true && obra.precio != null,
  }
}

function resumenRelacionada(obra) {
  return {
    titulo: obra.titulo,
    slug: obra.slug,
    anio: obra.anio,
    disciplina: obra.disciplina?.nombre || '',
    imagen: obra.imagenPrincipal,
    relacion: obra.relacion || relacionConfiable(obra.imagenPrincipal),
  }
}

// Si la obra está en una serie, solo las otras obras de esa serie, en su orden.
// Si no, hasta 3: primero la misma disciplina y después el resto del catálogo.
export function elegirRelacionadas(obras, actual) {
  const resto = obras.filter((obra) => obra.slug !== actual.slug)
  if (actual.serie?.slug) {
    return resto
      .filter((obra) => obra.serie?.slug === actual.serie.slug)
      .sort((a, b) => (a.ordenEnSerie ?? 999999) - (b.ordenEnSerie ?? 999999))
      .map(resumenRelacionada)
  }
  const mismaDisciplina = actual.disciplina?.slug
    ? resto.filter((obra) => obra.disciplina?.slug === actual.disciplina.slug)
    : []
  const otras = resto.filter((obra) => !mismaDisciplina.some((item) => item.slug === obra.slug))
  return [...mismaDisciplina, ...otras].slice(0, 3).map(resumenRelacionada)
}

const imagenConMedidas = imagen

// Obra vecina en el orden de la galería, para recorrer el catálogo con Anterior / Siguiente.
function vecina(obra) {
  return obra ? { titulo: obra.titulo, slug: obra.slug } : null
}

function vecinasEnSerie(vistas, actual) {
  if (!actual?.serie?.slug) return null
  const hermanas = vistas
    .filter((item) => item.serie?.slug === actual.serie.slug)
    .sort((a, b) => (a.ordenEnSerie ?? 999999) - (b.ordenEnSerie ?? 999999))
  const indice = hermanas.findIndex((item) => item.slug === actual.slug)
  if (indice < 0) return null
  return {
    serie: {
      nombre: actual.serie.nombre || '',
      slug: actual.serie.slug,
      href: rutaSerie(actual.serie.slug),
    },
    anterior: indice > 0 ? vecina(hermanas[indice - 1]) : null,
    siguiente: indice < hermanas.length - 1 ? vecina(hermanas[indice + 1]) : null,
    posicion: {actual: indice + 1, total: hermanas.length},
  }
}

function paginasDe(vistas, artista, configuracion) {
  const envioColeccion =
    typeof configuracion?.envioColeccion === 'string' ? configuracion.envioColeccion.trim() : ''

  return vistas.map((obra, indice) => ({
    params: { slug: obra.slug },
    props: {
      obra: {
        titulo: obra.titulo,
        slug: obra.slug,
        anio: obra.anio,
        tecnica: obra.tecnica,
        dimensiones: obra.dimensiones,
        estado: obra.estado,
        categoria: obra.categoria,
        proyecto: obra.proyecto,
        descripcionCorta: obra.descripcionCorta,
        imagenes: obra.imagenes,
        relacion: obra.relacion,
        serie: obra.serie?.slug ? {nombre: obra.serie.nombre || '', slug: obra.serie.slug} : null,
        altoCm: obra.altoCm,
        anchoCm: obra.anchoCm,
        precio: obra.precio,
        mostrarPrecio: obra.mostrarPrecio === true,
      },
      anterior: vecina(vistas[indice - 1]),
      siguiente: vecina(vistas[indice + 1]),
      relacionadas: elegirRelacionadas(vistas, obra),
      enSerie: vecinasEnSerie(vistas, obra),
      artista: {
        nombre: artista?.nombre || '',
        subtitulo: artista?.subtitulo || '',
      },
      configuracion: {
        email: configuracion?.email || '',
        whatsapp: configuracion?.whatsapp || '',
        ciudad: configuracion?.ciudad || '',
        instagram: configuracion?.instagram || '',
        vimeo: configuracion?.vimeo || '',
        youtube: configuracion?.youtube || '',
        envioColeccion,
      },
    },
  }))
}

function vistasDe(obras) {
  const vistas = []
  const usados = new Set()
  for (const obra of (obras || []).map(prepararObraDetalle)) {
    if (!obra.slug || usados.has(obra.slug)) continue
    usados.add(obra.slug)
    vistas.push(obra)
  }
  return vistas
}

export async function fetchPaginasObra() {
  if (enDemo) return paginasDe(vistasDe(obrasDemo()), demo.artista, demo.configuracion)

  const [artista, configuracion, obras] = await Promise.all([
    client.fetch(`*[_id == "artista"][0]{ nombre, subtitulo }`),
    client.fetch(`*[_id == "configuracion"][0]{
      email,
      whatsapp,
      ciudad,
      instagram,
      vimeo,
      youtube,
      envioColeccion
    }`),
    client.fetch(
      `*[_type == "obra" && ${VISIBLE}] | order(coalesce(ordenGaleria, 999999) asc) {
        titulo,
        "slug": slug.current,
        anio,
        tecnica,
        dimensiones,
        estado,
        categoria,
        proyecto,
        descripcionCorta,
        ordenEnSerie,
        altoCm,
        anchoCm,
        precio,
        mostrarPrecio,
        "serie": serie->{ nombre, "slug": slug.current },
        "disciplina": disciplina->{ nombre, "slug": slug.current },
        imagenPrincipal ${imagenConMedidas},
        imagenesAdicionales[] ${imagenConMedidas}
      }`,
    ),
  ])

  return paginasDe(vistasDe(obras), artista, configuracion)
}

export function datosVimeo(link) {
  try {
    const url = new URL(link)
    const partes = url.pathname.split('/').filter(Boolean)
    const id = partes.find((parte) => /^\d+$/.test(parte)) || ''
    const indice = id ? partes.indexOf(id) : -1
    const siguiente = indice >= 0 ? partes[indice + 1] || '' : ''
    const hash = siguiente && !/^\d+$/.test(siguiente) ? siguiente : url.searchParams.get('h') || ''
    return { id, hash }
  } catch {
    return { id: '', hash: '' }
  }
}

function miniaturaProyecto(imagen) {
  const ref = imagen?.asset?._ref || imagen?.asset?._id || ''
  if (!ref) return null
  const source = {
    alt: imagen.alt,
    crop: imagen.crop,
    hotspot: imagen.hotspot,
    asset: { _ref: ref },
  }
  const anchoReal = Number(imagen?.asset?.metadata?.dimensions?.width) || 0
  const altoReal = Number(imagen?.asset?.metadata?.dimensions?.height) || 0
  const ancho = anchoReal > 0 ? Math.min(anchoReal, 1600) : 1280
  const alto = altoReal > 0 ? Math.round((ancho * altoReal) / anchoReal) : 720
  const cadena = urlFor(source).width(ancho)
  const grande = (altoReal > 0 ? cadena : cadena.height(alto)).url()
  const chico = Math.max(320, Math.round(ancho / 2))
  const chica = urlFor(source).width(chico).url()
  return {
    src: grande,
    srcset: `${chica} ${chico}w, ${grande} ${ancho}w`,
    alt: imagen.alt || '',
    ancho: anchoReal || ancho,
    alto: altoReal || alto,
  }
}

async function prepararProyecto(proyecto) {
  const { id, hash } = datosVimeo(proyecto.linkVimeo)
  const miniatura = proyecto.miniatura?.asset ? miniaturaProyecto(proyecto.miniatura) : null
  const miniaturaUrl = miniatura ? '' : proyecto.miniaturaUrl || (await miniaturaVimeo(proyecto.linkVimeo, 1280))
  return {
    id: proyecto._id,
    titulo: proyecto.titulo || '',
    anio: proyecto.anio ?? null,
    duracion: proyecto.duracion || '',
    descripcionCorta: proyecto.descripcionCorta || '',
    categoria: proyecto.categoria || '',
    destacado: proyecto.destacado === true,
    miniatura,
    miniaturaUrl,
    ancho: Number(proyecto.ancho) || miniatura?.ancho || 0,
    alto: Number(proyecto.alto) || miniatura?.alto || 0,
    vimeoId: id,
    vimeoHash: hash,
  }
}

export async function fetchAudiovisual() {
  if (enDemo) {
    const proyectos = await Promise.all((await proyectosDemo()).map((proyecto) => prepararProyecto(proyecto)))
    return {
      artista: {
        nombre: demo.artista.nombre || '',
        subtitulo: demo.artista.subtitulo || '',
      },
      configuracion: datosContacto(demo.configuracion),
      bajada: demo.artista.heroAudiovisual?.bajada?.trim() || '',
      imagen: demo.artista.heroAudiovisual?.imagen || null,
      proyectos,
    }
  }

  const [artista, configuracion, documentos] = await Promise.all([
    client.fetch(`*[_id == "artista"][0]{
      nombre,
      subtitulo,
      heroAudiovisual {
        bajada,
        imagen ${imagen}
      }
    }`),
    client.fetch(`*[_id == "configuracion"][0]{
      email,
      whatsapp,
      ciudad,
      instagram,
      vimeo,
      youtube
    }`),
    client.fetch(`*[_type == "proyectoAudiovisual" && !(_id in path("drafts.**"))] | order(coalesce(anio, 0) desc, titulo asc) {
      _id,
      titulo,
      anio,
      duracion,
      descripcionCorta,
      linkVimeo,
      categoria,
      destacado,
      miniatura ${imagen}
    }`),
  ])

  const proyectos = await Promise.all((documentos || []).map((proyecto) => prepararProyecto(proyecto)))

  return {
    artista: {
      nombre: artista?.nombre || '',
      subtitulo: artista?.subtitulo || '',
    },
    configuracion: {
      email: configuracion?.email || '',
      whatsapp: configuracion?.whatsapp || '',
      ciudad: configuracion?.ciudad || '',
      instagram: configuracion?.instagram || '',
      vimeo: configuracion?.vimeo || '',
      youtube: configuracion?.youtube || '',
    },
    bajada: artista?.heroAudiovisual?.bajada?.trim() || '',
    imagen: artista?.heroAudiovisual?.imagen || null,
    proyectos,
  }
}

function listaDeTextos(valor) {
	if (!Array.isArray(valor)) return []
	return valor.map((item) => String(item || '').trim()).filter(Boolean)
}

function fotoRecorte(imagen, ancho, alto) {
	const ref = imagen?.asset?._ref || imagen?.asset?._id || ''
	if (!ref) return null
	const source = {
		alt: imagen.alt,
		crop: imagen.crop,
		hotspot: imagen.hotspot,
		asset: { _ref: ref },
	}
	const chico = Math.round(ancho / 2)
	const altoChico = Math.round((alto * chico) / ancho)
	const grande = urlFor(source).width(ancho).height(alto).url()
	const chica = urlFor(source).width(chico).height(altoChico).url()
	return {
		src: grande,
		srcset: `${chica} ${chico}w, ${grande} ${ancho}w`,
		alt: imagen.alt || '',
		ancho,
		alto,
	}
}

function datosContacto(configuracion) {
	return {
		email: configuracion?.email || '',
		whatsapp: configuracion?.whatsapp || '',
		ciudad: configuracion?.ciudad || '',
		instagram: configuracion?.instagram || '',
		vimeo: configuracion?.vimeo || '',
		youtube: configuracion?.youtube || '',
		creditos: String(configuracion?.creditos || '').trim(),
	}
}

export async function fetchPie() {
	if (enDemo) {
		return {
			nombre: demo.artista?.nombre || '',
			...datosContacto(demo.configuracion),
		}
	}
	const [artista, configuracion] = await Promise.all([
		client.fetch(`*[_id == "artista"][0]{ nombre }`),
		client.fetch(`*[_id == "configuracion"][0]{
      email, whatsapp, ciudad, instagram, vimeo, youtube, creditos
    }`),
	])
	return {
		nombre: artista?.nombre || '',
		...datosContacto(configuracion),
	}
}

function armarSobreMi(artista, configuracion) {
	const grupos = [
		{ id: 'obras', titulo: 'Obras y exposiciones', items: hitosDe(artista?.obrasExposiciones) },
		{ id: 'premios', titulo: 'Premios, becas y residencias', items: hitosDe(artista?.premiosBecasResidencias) },
		{ id: 'academica', titulo: 'Formación académica', items: hitosDe(artista?.formacionAcademica) },
		{ id: 'movimiento', titulo: 'Formación en cuerpo y movimiento', items: hitosDe(artista?.formacionMovimiento) },
		{ id: 'charlas', titulo: 'Charlas, docencia y otras actividades', items: hitosDe(artista?.charlasDocencia) },
	].filter((grupo) => grupo.items.length)
	return {
		artista: {
			nombre: artista?.nombre || '',
			subtitulo: artista?.subtitulo || '',
			bioCorta: artista?.bioCorta?.trim() || '',
			bioCompleta: artista?.bioCompleta || [],
			fraseStatement: String(artista?.fraseStatement || '').trim(),
			statement: artista?.statement || [],
			grupos,
			cvUrl: artista?.cv?.asset?.url || '',
			retrato: fotoRecorte(artista?.retrato, 900, 1200),
		},
		contacto: {
			...datosContacto(configuracion),
			foto: fotoRecorte(artista?.fotoTaller, 1200, 900),
		},
	}
}

function armarContacto(artista, configuracion) {
	return {
		artista: {
			nombre: artista?.nombre || '',
			subtitulo: artista?.subtitulo || '',
		},
		contacto: {
			...datosContacto(configuracion),
			foto: fotoRecorte(artista?.fotoTaller, 1200, 900),
		},
	}
}

export async function fetchSobreMi() {
	if (enDemo) return armarSobreMi(demo.artista, demo.configuracion)

	const [artista, configuracion] = await Promise.all([
		client.fetch(`*[_id == "artista"][0]{
      nombre,
      subtitulo,
      bioCorta,
      bioCompleta,
      fraseStatement,
      statement,
      obrasExposiciones[]{ periodo, titulo, detalle },
      premiosBecasResidencias[]{ periodo, titulo, detalle },
      formacionAcademica[]{ periodo, titulo, detalle },
      formacionMovimiento[]{ periodo, titulo, detalle },
      charlasDocencia[]{ periodo, titulo, detalle },
      cv { asset->{ url } },
      retrato ${imagen},
      fotoTaller ${imagen}
    }`),
		client.fetch(`*[_id == "configuracion"][0]{
      email,
      whatsapp,
      ciudad,
      instagram,
      vimeo,
      youtube
    }`),
	])

	return armarSobreMi(artista, configuracion)
}

export async function fetchContacto() {
	if (enDemo) return armarContacto(demo.artista, demo.configuracion)

	const [artista, configuracion] = await Promise.all([
		client.fetch(`*[_id == "artista"][0]{
      nombre,
      subtitulo,
      fotoTaller ${imagen}
    }`),
		client.fetch(`*[_id == "configuracion"][0]{
      email,
      whatsapp,
      ciudad,
      instagram,
      vimeo,
      youtube
    }`),
	])

	return armarContacto(artista, configuracion)
}

// ——— Series, disciplinas e inicio ———
// La forma de cada función es la misma con los datos de demo y con Sanity.

const porOrden = (a, b) => (a.orden ?? 999999) - (b.orden ?? 999999)

const proyeccionSerie = `{
  nombre,
  "slug": slug.current,
  anio,
  tecnicaGeneral,
  descripcion,
  destacada,
  principalInicio,
  orden,
  portada ${imagen},
  "disciplina": disciplina->{ nombre, "slug": slug.current },
  "cantidadObras": count(*[_type == "obra" && ${VISIBLE} && serie._ref == ^._id])
}`

const proyeccionObraLista = `{
  titulo,
  "slug": slug.current,
  anio,
  tecnica,
  dimensiones,
  estado,
  categoria,
  proyecto,
  ordenEnSerie,
  ordenGaleria,
  imagenPrincipal ${imagen},
  "serie": serie->{ nombre, "slug": slug.current },
  "disciplina": disciplina->{ nombre, "slug": slug.current }
}`

function normalizarDisciplina(valor) {
  if (!valor) return null
  if (typeof valor === 'string') {
    const encontrada = (demo.disciplinas || []).find((item) => item.slug === valor)
    return encontrada ? {nombre: encontrada.nombre, slug: encontrada.slug} : null
  }
  const slug = valor.slug || ''
  const nombre = valor.nombre || ''
  if (!slug && !nombre) return null
  return {nombre, slug}
}

function prepararDisciplina(disciplina) {
  return {
    nombre: disciplina.nombre || '',
    slug: disciplina.slug || '',
    href: rutaDisciplina(disciplina.slug),
    descripcion: String(disciplina.descripcion || '').trim(),
    mostrarEnMenu: disciplina.mostrarEnMenu !== false,
    orden: disciplina.orden ?? null,
    portada: imagenDisponible(disciplina.portada) ? disciplina.portada : null,
  }
}

function prepararSerie(serie, obras) {
  const cantidadObras = Number.isFinite(serie.cantidadObras)
    ? serie.cantidadObras
    : (obras || []).filter((obra) => obra.serie?.slug === serie.slug).length
  const descripcion =
    typeof serie.descripcion === 'string' ? serie.descripcion.trim() : textoDePortable(serie.descripcion)
  return {
    nombre: serie.nombre || '',
    slug: serie.slug || '',
    href: rutaSerie(serie.slug),
    disciplina: normalizarDisciplina(serie.disciplina),
    portada: imagenDisponible(serie.portada) ? serie.portada : null,
    descripcion,
    anio: String(serie.anio || '').trim(),
    tecnicaGeneral: String(serie.tecnicaGeneral || '').trim(),
    cantidadObras,
    destacada: serie.destacada === true,
    principalInicio: serie.principalInicio === true,
    orden: serie.orden ?? null,
  }
}

function seriesPublicadasDemo() {
  return [...(demo.series || [])].filter((serie) => serie.publicada !== false).sort(porOrden)
}

function obraDeLista(obra) {
  return {
    ...prepararObraGaleria(obra),
    ordenEnSerie: obra.ordenEnSerie ?? null,
  }
}

function obrasDeSerieDemo(slug) {
  return obrasDemo()
    .filter((obra) => obra.serie?.slug === slug)
    .sort((a, b) => (a.ordenEnSerie ?? 999999) - (b.ordenEnSerie ?? 999999))
    .map(obraDeLista)
}

function serieVecina(serie) {
  if (!serie) return null
  return {nombre: serie.nombre || '', slug: serie.slug || '', href: rutaSerie(serie.slug)}
}

export async function fetchDisciplinas() {
  if (enDemo) return [...(demo.disciplinas || [])].sort(porOrden).map(prepararDisciplina)
  const disciplinas = await client.fetch(
    `*[_type == "disciplina" && !(_id in path("drafts.**"))] | order(coalesce(orden, 999999) asc) {
      nombre,
      "slug": slug.current,
      descripcion,
      mostrarEnMenu,
      orden,
      portada ${imagen}
    }`,
  )
  return (disciplinas || []).map(prepararDisciplina)
}

export async function fetchSeries({disciplina = ''} = {}) {
  if (enDemo) {
    return seriesPublicadasDemo()
      .filter((serie) => !disciplina || serie.disciplina === disciplina)
      .map((serie) => prepararSerie(serie, obrasDemo()))
  }
  const series = await client.fetch(
    `*[_type == "serie" && ${VISIBLE} && ($disciplina == "" || disciplina->slug.current == $disciplina)]
      | order(coalesce(orden, 999999) asc) ${proyeccionSerie}`,
    {disciplina},
  )
  return (series || []).map((serie) => prepararSerie(serie))
}

export async function fetchSerie(slug) {
  if (!slug) return null
  if (enDemo) {
    const series = seriesPublicadasDemo()
    const indice = series.findIndex((item) => item.slug === slug)
    if (indice < 0) return null
    return {
      ...prepararSerie(series[indice], obrasDemo()),
      obras: obrasDeSerieDemo(slug),
      anterior: serieVecina(series[indice - 1]),
      siguiente: serieVecina(series[indice + 1]),
    }
  }
  const serie = await client.fetch(`*[_type == "serie" && slug.current == $slug && ${VISIBLE}][0] ${proyeccionSerie}`, {slug})
  if (!serie) return null
  const [obras, anterior, siguiente] = await Promise.all([
    client.fetch(
      `*[_type == "obra" && serie->slug.current == $slug && ${VISIBLE}] | order(coalesce(ordenEnSerie, 999999) asc) ${proyeccionObraLista}`,
      {slug},
    ),
    client.fetch(
      `*[_type == "serie" && ${VISIBLE} && coalesce(orden, 999999) < $orden] | order(coalesce(orden, 999999) desc)[0] ${proyeccionSerie}`,
      {orden: serie.orden ?? 999999},
    ),
    client.fetch(
      `*[_type == "serie" && ${VISIBLE} && coalesce(orden, 999999) > $orden] | order(coalesce(orden, 999999) asc)[0] ${proyeccionSerie}`,
      {orden: serie.orden ?? 999999},
    ),
  ])
  return {
    ...prepararSerie(serie),
    obras: (obras || []).map(obraDeLista),
    anterior: anterior ? serieVecina(prepararSerie(anterior)) : null,
    siguiente: siguiente ? serieVecina(prepararSerie(siguiente)) : null,
  }
}

export async function fetchObrasPorSerie(slug) {
  if (!slug) return []
  if (enDemo) return obrasDeSerieDemo(slug)
  const obras = await client.fetch(
    `*[_type == "obra" && serie->slug.current == $slug && ${VISIBLE}] | order(coalesce(ordenEnSerie, 999999) asc) ${proyeccionObraLista}`,
    {slug},
  )
  return (obras || []).map(obraDeLista)
}

export async function fetchObrasPorDisciplina(slug) {
  if (!slug) return []
  if (enDemo) {
    return obrasDemo()
      .filter((obra) => obra.disciplina?.slug === slug)
      .map(obraDeLista)
  }
  const obras = await client.fetch(
    `*[_type == "obra" && disciplina->slug.current == $slug && ${VISIBLE}] | order(coalesce(ordenGaleria, 999999) asc) ${proyeccionObraLista}`,
    {slug},
  )
  return (obras || []).map(obraDeLista)
}

export async function fetchDisciplina(slug) {
  if (!slug) return null
  const disciplinas = await fetchDisciplinas()
  const disciplina = disciplinas.find((item) => item.slug === slug)
  if (!disciplina) return null
  const [series, obras, inicio] = await Promise.all([
    fetchSeries({disciplina: slug}),
    fetchObrasPorDisciplina(slug),
    fetchInicio(),
  ])
  return {
    disciplina,
    series,
    obras: (obras || []).filter((obra) => !obra.serie?.slug),
    artista: inicio?.artista || null,
    configuracion: inicio?.configuracion || null,
  }
}

export async function fetchSeriePrincipal() {
  if (enDemo) {
    const serie = seriesPublicadasDemo().find((item) => item.principalInicio)
    return serie ? prepararSerie(serie, obrasDemo()) : null
  }
  const serie = await client.fetch(
    `*[_type == "serie" && principalInicio == true && ${VISIBLE}] | order(coalesce(orden, 999999) asc)[0] ${proyeccionSerie}`,
  )
  return serie ? prepararSerie(serie) : null
}

// Hasta 3 series destacadas. La principal ya tiene su banda en el Inicio: se puede excluir para no repetirla.
export async function fetchSeriesDestacadas({excluir = ''} = {}) {
  if (enDemo) {
    const obras = obrasDemo()
    return seriesPublicadasDemo()
      .filter((serie) => serie.destacada && serie.slug !== excluir)
      .slice(0, 3)
      .map((serie) => prepararSerie(serie, obras))
  }
  const series = await client.fetch(
    `*[_type == "serie" && destacada == true && slug.current != $excluir && ${VISIBLE}]
      | order(coalesce(orden, 999999) asc)[0...3] ${proyeccionSerie}`,
    {excluir},
  )
  return (series || []).map((serie) => prepararSerie(serie))
}

export async function fetchVecinasEnSerie(slug) {
  if (!slug) return {anterior: null, siguiente: null}
  if (enDemo) {
    const vistas = vistasDe(obrasDemo())
    const actual = vistas.find((obra) => obra.slug === slug)
    return vecinasEnSerie(vistas, actual)
  }
  const actual = await client.fetch(
    `*[_type == "obra" && slug.current == $slug && ${VISIBLE}][0]{ "slug": slug.current, "serieId": serie._ref }`,
    {slug},
  )
  if (!actual?.serieId) return {anterior: null, siguiente: null}
  const hermanas = await client.fetch(
    `*[_type == "obra" && serie._ref == $serieId && ${VISIBLE}] | order(coalesce(ordenEnSerie, 999999) asc) {
      titulo,
      "slug": slug.current
    }`,
    {serieId: actual.serieId},
  )
  return vecinasEnSerie(
    (hermanas || []).map((obra) => ({...obra, serie: {slug: 'misma'}})),
    {...actual, serie: {slug: 'misma'}},
  )
}

export async function fetchFicha(slug) {
  const paginas = await fetchPaginasObra()
  const pagina = paginas.find((item) => item.params.slug === slug)
  return pagina ? pagina.props : null
}

function prepararProyectoArtistico(proyecto) {
  const obras = (proyecto.obras || [])
    .map((obra) => ({
      titulo: obra.titulo || obra.nombre || '',
      slug: obra.slug?.current || obra.slug || '',
    }))
    .filter((obra) => obra.slug)
  return {
    tipo: proyecto.tipo || proyecto._type || '',
    nombre: proyecto.nombre || '',
    slug: proyecto.slug?.current || proyecto.slug || '',
    anio: String(proyecto.anio || '').trim(),
    lugar: String(proyecto.lugar || '').trim(),
    descripcion: typeof proyecto.descripcion === 'string' ? proyecto.descripcion.trim() : textoDePortable(proyecto.descripcion),
    portada: imagenDisponible(proyecto.portada) ? proyecto.portada : null,
    obras,
    orden: proyecto.orden ?? null,
  }
}

export async function fetchProyectos() {
  if (enDemo) {
    return [...(demo.proyectosArtisticos || [])]
      .filter((proyecto) => proyecto.publicada !== false)
      .sort(porOrden)
      .map(prepararProyectoArtistico)
  }
  const tipos = ['exposicion', 'performance', 'instalacion', 'accion']
  const proyectos = await client.fetch(
    `*[_type in $tipos && ${VISIBLE}] | order(coalesce(orden, 999999) asc) {
      _type,
      nombre,
      "slug": slug.current,
      anio,
      lugar,
      descripcion,
      orden,
      portada ${imagen},
      obras[]->{ titulo, "slug": slug.current }
    }`,
    {tipos},
  )
  return (proyectos || []).map((proyecto) => prepararProyectoArtistico({...proyecto, tipo: proyecto._type}))
}

function hitosDe(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((item) => ({
      periodo: String(item?.periodo || '').trim(),
      titulo: String(item?.titulo || '').trim(),
      detalle: String(item?.detalle || '').trim(),
    }))
    .filter((item) => item.periodo || item.titulo || item.detalle)
}

export async function fetchTrayectoria() {
  const vacia = {
    obrasExposiciones: [],
    premiosBecasResidencias: [],
    formacionAcademica: [],
    formacionMovimiento: [],
    charlasDocencia: [],
  }
  if (enDemo) {
    return {
      obrasExposiciones: hitosDe(demo.artista?.obrasExposiciones),
      premiosBecasResidencias: hitosDe(demo.artista?.premiosBecasResidencias),
      formacionAcademica: hitosDe(demo.artista?.formacionAcademica),
      formacionMovimiento: hitosDe(demo.artista?.formacionMovimiento),
      charlasDocencia: hitosDe(demo.artista?.charlasDocencia),
    }
  }
  const artista = await client.fetch(`*[_id == "artista"][0]{
    obrasExposiciones[]{ periodo, titulo, detalle },
    premiosBecasResidencias[]{ periodo, titulo, detalle },
    formacionAcademica[]{ periodo, titulo, detalle },
    formacionMovimiento[]{ periodo, titulo, detalle },
    charlasDocencia[]{ periodo, titulo, detalle }
  }`)
  if (!artista) return vacia
  return {
    obrasExposiciones: hitosDe(artista.obrasExposiciones),
    premiosBecasResidencias: hitosDe(artista.premiosBecasResidencias),
    formacionAcademica: hitosDe(artista.formacionAcademica),
    formacionMovimiento: hitosDe(artista.formacionMovimiento),
    charlasDocencia: hitosDe(artista.charlasDocencia),
  }
}

function prepararDiapositiva(diapositiva, disciplinas) {
  return {
    id: diapositiva._id,
    etiqueta: String(diapositiva.etiqueta || '').trim(),
    titulo: String(diapositiva.titulo || '').trim(),
    subtitulo: String(diapositiva.subtitulo || '').trim(),
    textoBoton: String(diapositiva.textoBoton || '').trim(),
    enlace: resolverEnlace(diapositiva.enlace, disciplinas),
    imagen: diapositiva.imagen,
  }
}

export async function fetchDiapositivasHero() {
  if (enDemo) {
    const disciplinas = (demo.disciplinas || []).map((item) => item.slug)
    return [...(demo.diapositivasHero || [])]
      .filter((diapositiva) => diapositiva.activa !== false && imagenDisponible(diapositiva.imagen))
      .sort(porOrden)
      .map((diapositiva) => prepararDiapositiva(diapositiva, disciplinas))
  }
  const [diapositivas, disciplinas] = await Promise.all([
    client.fetch(
      `*[_type == "diapositivaHero" && coalesce(activa, true) == true && !(_id in path("drafts.**"))]
        | order(coalesce(orden, 999999) asc) {
          _id,
          etiqueta,
          titulo,
          subtitulo,
          textoBoton,
          enlace,
          imagen ${imagen}
        }`,
    ),
    client.fetch(`*[_type == "disciplina" && !(_id in path("drafts.**"))].slug.current`),
  ])
  return (diapositivas || [])
    .filter((diapositiva) => imagenDisponible(diapositiva.imagen))
    .map((diapositiva) => prepararDiapositiva(diapositiva, disciplinas || []))
}

export async function fetchFraseInicio() {
  if (enDemo) return String(demo.artista?.fraseInicio || '').trim()
  const artista = await client.fetch(`*[_id == "artista"][0]{ fraseInicio }`)
  return String(artista?.fraseInicio || '').trim()
}

export async function fetchConfiguracionInicio() {
  const [frase, diapositivas, seriePrincipal, video] = await Promise.all([
    fetchFraseInicio(),
    fetchDiapositivasHero(),
    fetchSeriePrincipal(),
    fetchVideoReciente(),
  ])
  const seriesDestacadas = await fetchSeriesDestacadas({excluir: seriePrincipal?.slug || ''})
  return {frase, diapositivas, seriePrincipal, seriesDestacadas, video}
}

// El video más reciente, listo para el modal de Vimeo (o null si no hay ninguno).
export async function fetchVideoReciente() {
  if (enDemo) {
    const [video] = await proyectosDemo()
    return video ? prepararProyecto(video) : null
  }
  const video = await client.fetch(`*[_type == "proyectoAudiovisual" && defined(linkVimeo) && !(_id in path("drafts.**"))] | order(coalesce(anio, 0) desc, _createdAt desc) [0] {
      _id,
      titulo,
      anio,
      duracion,
      descripcionCorta,
      linkVimeo,
      categoria,
      destacado,
      miniatura ${imagen}
    }`)
  return video ? prepararProyecto(video) : null
}
