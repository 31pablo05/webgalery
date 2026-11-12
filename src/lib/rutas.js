// Todas las rutas del sitio, en un solo lugar.
// Las páginas de una obra con nombre (/obras/[obra]) y de sus cuadros se crean en la Etapa 3.
// Hasta entonces sus enlaces llevan a /obras para que la demo no tenga 404.
// En la Etapa 3: poner PROVISORIAS en false y nada más.
const PROVISORIAS = true

const OBRAS = '/obras'

export const rutas = {
	inicio: '/',
	obras: OBRAS,
	ilustraciones: '/ilustraciones',
	audiovisual: '/audiovisual',
	sobreMi: '/sobre-mi',
	contacto: '/contacto',
}

// Página de una obra con nombre (/obras/[obra]): la obra con todos sus cuadros.
// (Tipo interno "serie" en Sanity; en la web se habla de obras y cuadros.)
export function rutaObraConNombre(slug) {
	if (PROVISORIAS || !slug) return OBRAS
	return `${OBRAS}/${slug}`
}

// Sección de una disciplina (/obras, /ilustraciones y las que se agreguen).
export function rutaDisciplina(slug) {
	if (slug === 'ilustraciones') return rutas.ilustraciones
	if (slug === 'obras' || PROVISORIAS || !slug) return OBRAS
	return `/${slug}`
}

// Ficha de un cuadro suelto (/obras/[slug]): ya existe.
export function rutaObra(slug) {
	return slug ? `${OBRAS}/${slug}` : OBRAS
}

// Enlace cargado en Sanity: interno ("/audiovisual") o externo ("https://...").
export function esExterno(href) {
	return /^https?:\/\//i.test(String(href || ''))
}

// Un enlace cargado a mano que apunta a una página que todavía no existe se redirige a la provisoria.
// agrupaciones: slugs de las obras con nombre, porque comparten la ruta /obras/[slug] con los cuadros.
export function resolverEnlace(href, agrupaciones = []) {
	const destino = String(href || '').trim()
	if (!destino || esExterno(destino) || !PROVISORIAS) return destino
	if (/^\/series(\/|$|\?|#)/.test(destino)) return OBRAS
	const interna = destino.match(/^\/obras\/([^/?#]+)/)
	if (interna && agrupaciones.includes(interna[1])) return OBRAS
	return destino
}
