import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const TABS = [
	{ id: 'todos', label: 'Todos' },
	{ id: 'videoensayo', label: 'Videoensayo' },
	{ id: 'registro', label: 'Registro' },
	{ id: 'proceso', label: 'Proceso' },
	{ id: 'instalacion', label: 'Instalación' },
]

function meta(proyecto) {
	const partes = []
	if (proyecto.anio) partes.push(String(proyecto.anio))
	if (proyecto.duracion) partes.push(`${proyecto.duracion} min`)
	return partes.join(' · ')
}

function separar(proyectos, filtro) {
	const lista = filtro === 'todos' ? proyectos : proyectos.filter((proyecto) => proyecto.categoria === filtro)
	const destacado = lista.find((proyecto) => proyecto.destacado) || null
	const resto = lista.filter((proyecto) => proyecto !== destacado)
	const siguientes = []
	for (let i = 2; i < resto.length; i += 3) siguientes.push(resto.slice(i, i + 3))
	return { destacado, primera: resto.slice(0, 2), siguientes }
}

function fuente(proyecto) {
	if (proyecto.miniatura?.src) return proyecto.miniatura
	if (proyecto.miniaturaUrl) return { src: proyecto.miniaturaUrl, srcset: '', alt: '' }
	return null
}

function embed(proyecto) {
	const params = new URLSearchParams({
		autoplay: '1',
		title: '0',
		byline: '0',
		portrait: '0',
	})
	if (proyecto.vimeoHash) params.set('h', proyecto.vimeoHash)
	return `https://player.vimeo.com/video/${proyecto.vimeoId}?${params}`
}

function IconoPlay() {
	return (
		<svg viewBox="0 0 48 48" aria-hidden="true">
			<circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
			<path d="M21 17.5 32 24 21 30.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	)
}

function IconoCerrar() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.25" />
		</svg>
	)
}

function Miniatura({ proyecto, onAbrir, sizes, prioridad = false }) {
	const foto = fuente(proyecto)
	const alt = foto?.alt || proyecto.titulo || 'Video'
	return (
		<button
			type="button"
			className="av-mini"
			aria-label={`Reproducir ${proyecto.titulo || 'video'}`}
			onClick={(event) => onAbrir(proyecto, event)}
		>
			{foto && (
				<img
					src={foto.src}
					srcSet={foto.srcset || undefined}
					sizes={sizes}
					alt={alt}
					width="1280"
					height="720"
					loading={prioridad ? 'eager' : 'lazy'}
					fetchPriority={prioridad ? 'high' : 'auto'}
					decoding="async"
				/>
			)}
			<span className="av-mini__velo" />
			<span className="av-mini__play">
				<IconoPlay />
			</span>
		</button>
	)
}

function Tarjeta({ proyecto, compacto = false, onAbrir }) {
	const linea = meta(proyecto)
	return (
		<article className="av-card">
			<Miniatura
				proyecto={proyecto}
				onAbrir={onAbrir}
				sizes={compacto ? '(min-width: 64rem) 16vw, 100vw' : '(min-width: 64rem) 24vw, 100vw'}
			/>
			<div className="av-card__texto">
				<h3 className={compacto ? 'av-card__titulo av-card__titulo--compacto' : 'av-card__titulo'}>
					{proyecto.titulo}
				</h3>
				{linea && <p className="label">{linea}</p>}
				{proyecto.descripcionCorta && <p className="av-card__desc">{proyecto.descripcionCorta}</p>}
			</div>
		</article>
	)
}

function Destacado({ proyecto, onAbrir }) {
	const linea = meta(proyecto)
	return (
		<article className="av-destacado">
			<Miniatura proyecto={proyecto} onAbrir={onAbrir} sizes="(min-width: 64rem) 55vw, 100vw" prioridad />
			<div className="av-destacado__texto">
				<p className="label">Proyecto destacado</p>
				<h3 className="av-destacado__titulo">{proyecto.titulo}</h3>
				{linea && <p className="label">{linea}</p>}
				{proyecto.descripcionCorta && <p className="av-destacado__desc">{proyecto.descripcionCorta}</p>}
				<button type="button" className="btn btn-solid" onClick={(event) => onAbrir(proyecto, event)}>
					Ver video completo <span className="arrow" aria-hidden="true">→</span>
				</button>
			</div>
		</article>
	)
}

export default function Listado({ proyectos = [] }) {
	const [filtro, setFiltro] = useState('todos')
	const [cambiando, setCambiando] = useState(false)
	const [activo, setActivo] = useState(null)
	const espera = useRef(0)
	const origen = useRef(null)
	const cerrarBtn = useRef(null)

	useEffect(() => () => window.clearTimeout(espera.current), [])

	useEffect(() => {
		if (!activo) return undefined
		const overflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		cerrarBtn.current?.focus()

		function tecla(event) {
			if (event.key !== 'Escape') return
			event.preventDefault()
			setActivo(null)
			origen.current?.focus()
		}

		window.addEventListener('keydown', tecla)
		return () => {
			document.body.style.overflow = overflow
			window.removeEventListener('keydown', tecla)
		}
	}, [activo])

	function elegir(siguiente) {
		if (siguiente === filtro) return
		window.clearTimeout(espera.current)
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		if (reduce) {
			setFiltro(siguiente)
			setCambiando(false)
			return
		}
		setCambiando(true)
		espera.current = window.setTimeout(() => {
			setFiltro(siguiente)
			espera.current = window.setTimeout(() => setCambiando(false), 20)
		}, 200)
	}

	function abrir(proyecto, event) {
		if (!proyecto?.vimeoId) return
		origen.current = event?.currentTarget || null
		setActivo(proyecto)
	}

	function cerrar() {
		setActivo(null)
		origen.current?.focus()
	}

	const { destacado, primera, siguientes } = separar(proyectos, filtro)
	const hay = Boolean(destacado) || primera.length > 0

	const modal = activo
		? createPortal(
				<div className="av-modal" role="dialog" aria-modal="true" aria-label={activo.titulo || 'Video'} onClick={cerrar}>
					<button
						ref={cerrarBtn}
						type="button"
						className="lightbox__btn lightbox__cerrar"
						aria-label="Cerrar"
						onClick={(event) => {
							event.stopPropagation()
							cerrar()
						}}
					>
						<IconoCerrar />
					</button>
					<div className="av-modal__marco" onClick={(event) => event.stopPropagation()}>
						<iframe
							src={embed(activo)}
							title={activo.titulo || 'Video'}
							allow="autoplay; fullscreen; picture-in-picture"
							allowFullScreen
						/>
					</div>
				</div>,
				document.body,
			)
		: null

	return (
		<div>
			<div className="av-barra">
				<h2 className="av-barra__titulo">Proyectos audiovisuales</h2>
				<span className="av-barra__corte" aria-hidden="true" />
				<div className="galeria-tabs" role="tablist" aria-label="Filtrar proyectos">
					{TABS.map((tab, index) => (
						<span key={tab.id} className="galeria-par">
							{index > 0 && (
								<span className="galeria-punto" aria-hidden="true">
									·
								</span>
							)}
							<button
								type="button"
								role="tab"
								className="galeria-tab"
								aria-selected={filtro === tab.id}
								onClick={() => elegir(tab.id)}
							>
								{tab.label}
							</button>
						</span>
					))}
				</div>
			</div>

			<div className={cambiando ? 'galeria-resultados is-cambiando' : 'galeria-resultados'}>
				{!hay && <p className="av-vacio">No hay proyectos en esta selección.</p>}
				{destacado && <Destacado proyecto={destacado} onAbrir={abrir} />}
				{primera.length > 0 && (
					<div className="av-fila av-fila--dos">
						{primera.map((proyecto) => (
							<Tarjeta key={proyecto.id} proyecto={proyecto} onAbrir={abrir} />
						))}
					</div>
				)}
				{siguientes.map((fila) => (
					<div className="av-fila av-fila--tres" key={fila.map((proyecto) => proyecto.id).join('-')}>
						{fila.map((proyecto) => (
							<Tarjeta key={proyecto.id} proyecto={proyecto} compacto onAbrir={abrir} />
						))}
					</div>
				))}
			</div>
			{modal}
		</div>
	)
}
