import { useEffect, useRef, useState } from 'react'
import ModalVimeo from './ModalVimeo.jsx'
import ObraPlaceholder from '../obras/ObraPlaceholder.jsx'

const ETIQUETAS = {
	videoensayo: 'Videoensayo',
	registro: 'Registro',
	proceso: 'Proceso',
	instalacion: 'Instalación',
}

function meta(proyecto) {
	return [proyecto.anio, proyecto.duracion].filter(Boolean).join(' · ')
}

function opciones(proyectos) {
	const vistas = []
	const usadas = new Set()
	for (const proyecto of proyectos) {
		if (!proyecto.categoria || usadas.has(proyecto.categoria)) continue
		usadas.add(proyecto.categoria)
		vistas.push({
			id: proyecto.categoria,
			label: ETIQUETAS[proyecto.categoria] || proyecto.categoria,
		})
	}
	if (vistas.length < 1) return []
	return [{ id: 'todos', label: 'Todos' }, ...vistas]
}

function proporcion(proyecto) {
	if (proyecto.ancho > 0 && proyecto.alto > 0) return `${proyecto.ancho} / ${proyecto.alto}`
	return '3 / 2'
}

function Miniatura({ proyecto, onAbrir, sizes, prioridad = false }) {
	const foto = proyecto.miniatura?.src ? proyecto.miniatura : proyecto.miniaturaUrl ? { src: proyecto.miniaturaUrl, alt: '' } : null
	const [rota, setRota] = useState(false)
	const alt = foto?.alt || proyecto.titulo || 'Video'
	return (
		<button type="button" className="av-mini" style={{ aspectRatio: proporcion(proyecto) }} aria-label={`Reproducir ${proyecto.titulo || 'video'}`} onClick={(event) => onAbrir(proyecto, event)}>
			{foto?.src && !rota ? (
				<img
					src={foto.src}
					srcSet={foto.srcset || undefined}
					sizes={sizes}
					alt={alt}
					width={proyecto.ancho || 1280}
					height={proyecto.alto || 720}
					loading={prioridad ? 'eager' : 'lazy'}
					fetchPriority={prioridad ? 'high' : 'auto'}
					decoding="async"
					onError={() => setRota(true)}
				/>
			) : (
				<ObraPlaceholder llenar pie proporcion={proyecto.alto > proyecto.ancho ? 'vertical' : 'horizontal'} titulo={proyecto.titulo} />
			)}
			<span className="av-mini__play" aria-hidden="true">
				▶
			</span>
		</button>
	)
}

function Ficha({ proyecto, onAbrir, destacado = false }) {
	const linea = meta(proyecto)
	return (
		<article className={destacado ? 'av-destacado' : 'av-card'}>
			<Miniatura
				proyecto={proyecto}
				onAbrir={onAbrir}
				prioridad={destacado}
				sizes={destacado ? '(min-width: 64rem) 58vw, 100vw' : '(min-width: 64rem) 28vw, 100vw'}
			/>
			<div className={destacado ? 'av-destacado__texto' : 'av-card__texto'}>
				{destacado && <p className="label">Proyecto destacado</p>}
				{destacado ? (
					<h2 className="av-destacado__titulo">{proyecto.titulo}</h2>
				) : (
					<h3 className="av-card__titulo">{proyecto.titulo}</h3>
				)}
				{linea && <p className="av-card__meta">{linea}</p>}
				{proyecto.descripcionCorta && <p className="av-card__desc">{proyecto.descripcionCorta}</p>}
				<button type="button" className="btn btn-relleno" onClick={(event) => onAbrir(proyecto, event)}>
					Ver video
				</button>
			</div>
		</article>
	)
}

export default function Listado({ proyectos = [] }) {
	const tabs = opciones(proyectos)
	const [filtro, setFiltro] = useState('todos')
	const [activo, setActivo] = useState(null)
	const origen = useRef(null)
	const lista = filtro === 'todos' ? proyectos : proyectos.filter((proyecto) => proyecto.categoria === filtro)
	const destacado = lista.find((proyecto) => proyecto.destacado) || lista[0] || null
	const resto = lista.filter((proyecto) => proyecto !== destacado)

	useEffect(() => {
		if (filtro !== 'todos' && !tabs.some((tab) => tab.id === filtro)) setFiltro('todos')
	}, [filtro, tabs])

	function abrir(proyecto, event) {
		if (!proyecto?.vimeoId) return
		origen.current = event?.currentTarget || null
		setActivo(proyecto)
	}

	function cerrar() {
		setActivo(null)
		origen.current?.focus()
	}

	if (!proyectos.length) return null

	return (
		<div className="av-listado contenedor">
			{tabs.length > 1 && (
				<div className="galeria-tabs" role="tablist" aria-label="Filtrar proyectos">
					{tabs.map((tab) => (
						<button key={tab.id} type="button" role="tab" className="galeria-tab" aria-selected={filtro === tab.id} onClick={() => setFiltro(tab.id)}>
							{tab.label}
						</button>
					))}
				</div>
			)}
			{destacado && <Ficha proyecto={destacado} onAbrir={abrir} destacado />}
			{resto.length > 0 && (
				<ul className="av-grilla">
					{resto.map((proyecto) => (
						<li key={proyecto.id}>
							<Ficha proyecto={proyecto} onAbrir={abrir} />
						</li>
					))}
				</ul>
			)}
			<ModalVimeo proyecto={activo} onCerrar={cerrar} />
		</div>
	)
}
