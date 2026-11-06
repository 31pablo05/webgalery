import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {createClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import * as demo from '../data/demo.js'

const API_VERSION = '2026-11-05'
const LIMITE_SI_NO_HAY_CONFIG = 30
const COLOR_SUPERFICIE = '#edeae4'

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
  const coincide = String(ref).match(/^image-demo-(.+)-(\d+)x(\d+)-[a-z0-9]+$/)
  if (!coincide) return null
  return {
    archivo: `${coincide[1]}.jpg`,
    ancho: Number(coincide[2]),
    alto: Number(coincide[3]),
  }
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
      if (!archivosDemo.has(datos.archivo)) {
        const ruta = join(process.cwd(), 'public', 'demo', datos.archivo)
        archivosDemo.set(datos.archivo, existsSync(ruta) ? `/demo/${datos.archivo}` : '')
      }
      const archivo = archivosDemo.get(datos.archivo)
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

function limiteDe(valor) {
  return typeof valor === 'number' && valor > 0 ? valor : LIMITE_SI_NO_HAY_CONFIG
}

export async function getLimiteObras() {
  if (enDemo) return limiteDe(demo.configuracion.limiteObras)
  const limite = await client.fetch(`*[_id == "configuracion"][0].limiteObras`)
  return limiteDe(limite)
}

export async function fetchObras(filtro = '', params = {}) {
  const limitePlan = await getLimiteObras()
  if (enDemo) return demo.obras.slice(0, limitePlan)
  const permitidas = `*[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) [0...$limitePlan]`
  const query = filtro ? `${permitidas}[${filtro}]` : permitidas
  return client.fetch(query, {...params, limitePlan})
}

const imagen = `{
  alt,
  crop,
  hotspot,
  asset
}`

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
        : await miniaturaVimeo(proyecto.linkVimeo)
      return {...proyecto, miniaturaUrl}
    }),
  )
}

function obrasDentroDelPlan() {
  return demo.obras.slice(0, limiteDe(demo.configuracion.limiteObras))
}

export async function fetchInicio() {
  if (enDemo) {
    const permitidas = new Set(obrasDentroDelPlan().map((obra) => obra.slug))
    const destacadas = demo.obras
      .filter((obra) => obra.destacadaEnInicio && permitidas.has(obra.slug))
      .slice(0, 4)
      .map((obra) => ({
        titulo: obra.titulo,
        slug: obra.slug,
        imagenPrincipal: obra.imagenPrincipal,
      }))
    const proyectos = demo.proyectos
      .filter((proyecto) => proyecto.mostrarEnInicio)
      .sort((a, b) => (b.anio || 0) - (a.anio || 0))
      .slice(0, 2)
    return {
      artista: demo.artista,
      configuracion: demo.configuracion,
      destacadas,
      audiovisual: await conMiniatura(proyectos),
    }
  }

  const limitePlan = await getLimiteObras()

  const [artista, configuracion, destacadas, proyectos] = await Promise.all([
    client.fetch(`*[_id == "artista"][0]{
      nombre,
      subtitulo,
      bioCorta,
      heroInicio {
        linea1,
        linea2,
        linea3,
        bajada,
        imagen ${imagen}
      },
      retrato ${imagen}
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
      `*[_type == "obra" && destacadaEnInicio == true && !(_id in path("drafts.**")) && _id in *[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) [0...$limitePlan]._id] | order(coalesce(ordenGaleria, 999999) asc) [0...4] {
        titulo,
        "slug": slug.current,
        imagenPrincipal ${imagen}
      }`,
      {limitePlan},
    ),
    client.fetch(`*[_type == "proyectoAudiovisual" && mostrarEnInicio == true && !(_id in path("drafts.**"))] | order(anio desc) [0...2] {
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
    serie: (obra.serie || '').trim(),
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
  const chica = urlFor(source).width(640).url()
  const grande = urlFor(source).width(1280).url()
  return {
    ...base,
    imagen: {
      src: grande,
      srcset: `${chica} 640w, ${grande} 1280w`,
      ancho,
      alto,
      alt: imagen.alt || obra.titulo || '',
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
      obras: obrasDentroDelPlan()
        .filter((obra) => obra?.slug)
        .map(prepararObraGaleria),
    }
  }

  const limitePlan = await getLimiteObras()
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
      `*[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) [0...$limitePlan] {
        titulo,
        "slug": slug.current,
        anio,
        tecnica,
        dimensiones,
        estado,
        categoria,
        serie,
        imagenPrincipal {
          alt,
          crop,
          hotspot,
          asset->{
            _id,
            metadata { dimensions { width, height } }
          }
        }
      }`,
      { limitePlan },
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
  const chica = urlFor(fuente.source).width(700).url()
  const grande = urlFor(fuente.source).width(1400).url()
  const thumbChica = urlFor(fuente.source).width(90).height(90).url()
  const thumb = urlFor(fuente.source).width(180).height(180).url()
  const luz = urlFor(fuente.source).width(2000).url()
  return {
    alt: fuente.alt || titulo || '',
    ancho: fuente.ancho,
    alto: fuente.alto,
    thumb,
    thumbSrcset: `${thumbChica} 90w, ${thumb} 180w`,
    src: grande,
    srcset: `${chica} 700w, ${grande} 1400w`,
    lightbox: luz,
    lightboxSrcset: `${grande} 1400w, ${luz} 2000w`,
  }
}

function miniaturaCuadrada(imagen, altTitulo) {
  const fuente = fuenteDe(imagen)
  if (!fuente) return null
  const chica = urlFor(fuente.source).width(480).height(480).url()
  const grande = urlFor(fuente.source).width(900).height(900).url()
  return {
    src: grande,
    srcset: `${chica} 480w, ${grande} 900w`,
    alt: fuente.alt || altTitulo || '',
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
    serie: (obra.serie || '').trim(),
    descripcionCorta: obra.descripcionCorta || '',
    imagenes: fotos,
    miniatura: miniaturaCuadrada(obra.imagenPrincipal, obra.titulo),
  }
}

export function elegirRelacionadas(obras, actual) {
  const resto = obras.filter((obra) => obra.slug !== actual.slug)
  const mismas = actual.serie ? resto.filter((obra) => obra.serie === actual.serie) : []
  const otras = actual.serie ? resto.filter((obra) => obra.serie !== actual.serie) : resto
  return [...mismas, ...otras].slice(0, 4).map((obra) => ({
    titulo: obra.titulo,
    slug: obra.slug,
    miniatura: obra.miniatura || null,
  }))
}

const imagenConMedidas = `{
  alt,
  crop,
  hotspot,
  asset->{
    _id,
    metadata { dimensions { width, height } }
  }
}`

function paginasDe(vistas, artista, configuracion) {
  const envioColeccion =
    typeof configuracion?.envioColeccion === 'string' ? configuracion.envioColeccion.trim() : ''

  return vistas.map((obra) => ({
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
        serie: obra.serie,
        descripcionCorta: obra.descripcionCorta,
        imagenes: obra.imagenes,
      },
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
  if (enDemo) return paginasDe(vistasDe(obrasDentroDelPlan()), demo.artista, demo.configuracion)

  const limitePlan = await getLimiteObras()
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
      `*[_type == "obra" && !(_id in path("drafts.**"))] | order(coalesce(ordenGaleria, 999999) asc) [0...$limitePlan] {
        titulo,
        "slug": slug.current,
        anio,
        tecnica,
        dimensiones,
        estado,
        categoria,
        serie,
        descripcionCorta,
        imagenPrincipal ${imagenConMedidas},
        imagenesAdicionales[] ${imagenConMedidas}
      }`,
      { limitePlan },
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
  const miniaturaUrl = miniatura ? '' : await miniaturaVimeo(proyecto.linkVimeo, 1280)
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

function ordenarProyectos(lista) {
  return [...lista].sort(
    (a, b) => (b.anio || 0) - (a.anio || 0) || String(a.titulo).localeCompare(String(b.titulo), 'es'),
  )
}

export async function fetchAudiovisual() {
  if (enDemo) {
    const proyectos = await Promise.all(ordenarProyectos(demo.proyectos).map((proyecto) => prepararProyecto(proyecto)))
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
