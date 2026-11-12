// Todas las rutas del sitio, en un solo lugar.
// /series, /series/[slug] y /obras/[disciplina] ya existen. PROVISORIAS queda en false
// para que el menú y el Inicio apunten a esas páginas.
const PROVISORIAS = false

const OBRAS = '/obras'

export const rutas = {
	inicio: '/',
	obras: OBRAS,
	audiovisual: '/audiovisual',
	sobreMi: '/sobre-mi',
	contacto: '/contacto',
	series: PROVISORIAS ? OBRAS : '/series',
}

// Página de una serie (/series/[slug]).
export function rutaSerie(slug) {
	if (PROVISORIAS || !slug) return rutas.series
	return `/series/${slug}`
}

// Página de una disciplina (/obras/pinturas, /obras/obras-sobre-papel...).
export function rutaDisciplina(slug) {
	if (PROVISORIAS || !slug) return OBRAS
	return `${OBRAS}/${slug}`
}

// Página de una obra (/obras/[slug]): ya existe.
export function rutaObra(slug) {
	return slug ? `${OBRAS}/${slug}` : OBRAS
}

// Enlace cargado en Sanity: interno ("/audiovisual") o externo ("https://...").
export function esExterno(href) {
	return /^https?:\/\//i.test(String(href || ''))
}

// Un enlace cargado a mano que apunta a una página que todavía no existe se redirige a la provisoria.
// disciplinas: slugs de las disciplinas, porque comparten la ruta /obras/[slug] con las obras.
export function resolverEnlace(href, disciplinas = []) {
	const destino = String(href || '').trim()
	if (!destino || esExterno(destino) || !PROVISORIAS) return destino
	if (/^\/series(\/|$|\?|#)/.test(destino)) return rutas.series
	const disciplina = destino.match(/^\/obras\/([^/?#]+)/)
	if (disciplina && disciplinas.includes(disciplina[1])) return OBRAS
	return destino
}
