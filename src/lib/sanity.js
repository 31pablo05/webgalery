import {existsSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import * as demo from '../data/demo.js'
import {textoDePortable} from './texto.js'
import {resolverEnlace, rutaDisciplina, rutaObra, rutaObraConNombre} from './rutas.js'

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

function nombreReal(archivo) {
  if (!listadoDemo) {
    const carpeta = join(process.cwd(), 'public', 'demo')
    try {
      listadoDemo = new Map(readdirSync(carpeta).map((nombre) => [nombre.toLowerCase(), nombre]))
    } catch {
      listadoDemo = new Map()
    }
  }
  return listadoDemo.get(String(archivo).toLowerCase()) || ''
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
    for (const ancho of ANCHOS_DEMO) {
      if (ancho < necesario || ancho >= datos.ancho) continue
      const variante = archivoDemo(`${datos.nombre}-${ancho}.${datos.extension}`)
      if (variante) return variante
    }
  }
  return archivoDemo(datos.archivo)
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
  return demo.obras.filter((obra) => imagenDisponible(obra.imagenPrincipal))
}

export async function fetchObras(filtro = '', params = {}) {
  if (enDemo) return obrasDemo()
  const publicadas = `*[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc)`
  const query = filtro ? `${publicadas}[${filtro}]` : publicadas
  return client.fetch(query, params)
}

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
  visitar([demo.obras, demo.artista, demo.configuracion, demo.series, demo.disciplinas, demo.diapositivasHero])

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
      `*[_type == "obra" && destacadaEnInicio == true && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) [0...4] {
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
    imagen: null,
  }
  if (!ref) return base

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
      `*[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) {
        titulo,
        "slug": slug.current,
        anio,
        tecnica,
        dimensiones,
        estado,
        categoria,
        proyecto,
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
    imagenPrincipal: obra.imagenPrincipal?.asset ? obra.imagenPrincipal : null,
  }
}

// "Más obras": 3 obras, primero las del mismo proyecto; se muestran en su proporción original.
export function elegirRelacionadas(obras, actual) {
  const resto = obras.filter((obra) => obra.slug !== actual.slug && obra.imagenPrincipal)
  const mismas = actual.proyecto ? resto.filter((obra) => obra.proyecto === actual.proyecto) : []
  const otras = actual.proyecto ? resto.filter((obra) => obra.proyecto !== actual.proyecto) : resto
  return [...mismas, ...otras].slice(0, 3).map((obra) => ({
    titulo: obra.titulo,
    slug: obra.slug,
    anio: obra.anio,
    proyecto: obra.proyecto,
    imagen: obra.imagenPrincipal,
  }))
}

const imagenConMedidas = imagen

// Obra vecina en el orden de la galería, para recorrer el catálogo con Anterior / Siguiente.
function vecina(obra) {
  return obra ? { titulo: obra.titulo, slug: obra.slug } : null
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
      },
      anterior: vecina(vistas[indice - 1]),
      siguiente: vecina(vistas[indice + 1]),
      relacionadas: elegirRelacionadas(vistas, obra),
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
      `*[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) {
        titulo,
        "slug": slug.current,
        anio,
        tecnica,
        dimensiones,
        estado,
        categoria,
        proyecto,
        descripcionCorta,
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
  const chica = urlFor(source).width(640).height(360).url()
  const grande = urlFor(source).width(1280).height(720).url()
  return {
    src: grande,
    srcset: `${chica} 640w, ${grande} 1280w`,
    alt: imagen.alt || '',
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
	}
}

function armarSobreMi(artista, configuracion) {
	return {
		artista: {
			nombre: artista?.nombre || '',
			subtitulo: artista?.subtitulo || '',
			bioCorta: artista?.bioCorta?.trim() || '',
			bioCompleta: artista?.bioCompleta || [],
			trayectoria: listaDeTextos(artista?.trayectoria),
			exposiciones: listaDeTextos(artista?.exposiciones),
			residencias: listaDeTextos(artista?.residencias),
			publicaciones: listaDeTextos(artista?.publicaciones),
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
      trayectoria,
      exposiciones,
      residencias,
      publicaciones,
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

// ——— Inicio (Etapa 1) ———
// En modo demo devuelven los datos de src/data/demo.js con la misma forma que tendrán desde Sanity.
// Las consultas GROQ de diapositivas, series y disciplinas se escriben en la Etapa 2: hasta entonces,
// con Sanity configurado, devuelven vacío y el Inicio oculta esas secciones.

const porOrden = (a, b) => (a.orden ?? 999999) - (b.orden ?? 999999)

function disciplinaDe(slug) {
  const disciplina = (demo.disciplinas || []).find((item) => item.slug === slug)
  return disciplina ? {nombre: disciplina.nombre, slug: disciplina.slug} : null
}

function prepararDisciplina(disciplina) {
  return {
    nombre: disciplina.nombre || '',
    slug: disciplina.slug || '',
    href: rutaDisciplina(disciplina.slug),
    descripcion: String(disciplina.descripcion || '').trim(),
    mostrarEnMenu: disciplina.mostrarEnMenu !== false,
    portada: imagenDisponible(disciplina.portada) ? disciplina.portada : null,
  }
}

export async function fetchDisciplinas() {
  if (!enDemo) return []
  return [...(demo.disciplinas || [])].sort(porOrden).map(prepararDisciplina)
}

function prepararSerie(serie, obras) {
  // Los cuadros de la obra, en su orden (solo los que ya tienen foto procesada).
  const cuadros = obras
    .filter((obra) => obra.serie?.slug === serie.slug)
    .sort((a, b) => (a.ordenEnSerie ?? 99) - (b.ordenEnSerie ?? 99))
    .map((obra) => ({
      titulo: obra.titulo || '',
      slug: obra.slug || '',
      href: rutaObra(obra.slug),
      imagen: obra.imagenPrincipal || null,
    }))
  const cantidadObras = cuadros.length
  return {
    nombre: serie.nombre || '',
    slug: serie.slug || '',
    href: rutaObraConNombre(serie.slug),
    cuadros,
    disciplina: serie.disciplina ? disciplinaDe(serie.disciplina) : null,
    portada: imagenDisponible(serie.portada) ? serie.portada : null,
    descripcion: textoDePortable(serie.descripcion),
    anio: String(serie.anio || '').trim(),
    tecnicaGeneral: String(serie.tecnicaGeneral || '').trim(),
    cantidadObras,
  }
}

function seriesPublicadasDemo() {
  return [...(demo.series || [])].filter((serie) => serie.publicada !== false).sort(porOrden)
}

export async function fetchSeriePrincipal() {
  if (!enDemo) return null
  const serie = seriesPublicadasDemo().find((item) => item.principalInicio)
  return serie ? prepararSerie(serie, obrasDemo()) : null
}

// Hasta 3 series destacadas. La principal ya tiene su banda en el Inicio: se puede excluir para no repetir su portada.
export async function fetchSeriesDestacadas({excluir = ''} = {}) {
  if (!enDemo) return []
  const obras = obrasDemo()
  return seriesPublicadasDemo()
    .filter((serie) => serie.destacada && serie.slug !== excluir)
    .slice(0, 3)
    .map((serie) => prepararSerie(serie, obras))
}

export async function fetchDiapositivasHero() {
  if (!enDemo) return []
  // Las obras con nombre comparten /obras/[slug] con los cuadros: sus enlaces van a la provisoria.
  const agrupaciones = (demo.series || []).map((item) => item.slug)
  return [...(demo.diapositivasHero || [])]
    .filter((diapositiva) => diapositiva.activa !== false && imagenDisponible(diapositiva.imagen))
    .sort(porOrden)
    .map((diapositiva) => ({
      id: diapositiva._id,
      etiqueta: String(diapositiva.etiqueta || '').trim(),
      titulo: String(diapositiva.titulo || '').trim(),
      subtitulo: String(diapositiva.subtitulo || '').trim(),
      textoBoton: String(diapositiva.textoBoton || '').trim(),
      enlace: resolverEnlace(diapositiva.enlace, agrupaciones),
      imagen: diapositiva.imagen,
    }))
}

export async function fetchFraseInicio() {
  if (enDemo) return String(demo.artista?.fraseInicio || '').trim()
  const artista = await client.fetch(`*[_id == "artista"][0]{ fraseInicio }`)
  return String(artista?.fraseInicio || '').trim()
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
