import { useEffect, useRef, useState } from 'react'
import ObraPlaceholder from './ObraPlaceholder.jsx'
import { relacionDe } from '../../lib/proporcion.js'

// Medidas de referencia (grilla de 1440 px) para repartir las obras sin dejar huecos.
const COLUMNA = 91.3
const SEPARACION = 24
const PIE = 56
const ENTRE_OBRAS = 44
const DESFASAJE = 40

const COLUMNAS = {
	2: ['1 / 7', '8 / 13'],
	3: ['1 / 5', '5 / 9', '9 / 13'],
	4: ['1 / 4', '4 / 7', '7 / 10', '10 / 13'],
}

function opciones(obras) {
	const disciplinas = []
	const series = []
	const vistas = { disciplina: new Set(), serie: new Set() }
	for (const obra of obras) {
		if (obra.disciplina?.slug && !vistas.disciplina.has(obra.disciplina.slug)) {
			vistas.disciplina.add(obra.disciplina.slug)
			disciplinas.push({
				id: `disciplina:${obra.disciplina.slug}`,
				tipo: 'disciplina',
				slug: obra.disciplina.slug,
				label: obra.disciplina.nombre || obra.disciplina.slug,
			})
		}
		if (obra.serie?.slug && !vistas.serie.has(obra.serie.slug)) {
			vistas.serie.add(obra.serie.slug)
			series.push({
				id: `serie:${obra.serie.slug}`,
				tipo: 'serie',
				slug: obra.serie.slug,
				label: obra.serie.nombre || obra.serie.slug,
				grupo: series.length === 0 && disciplinas.length > 0,
			})
		}
	}
	if (disciplinas.length + series.length === 0) return []
	return [{ id: 'todas', tipo: 'todas', label: 'Todas' }, ...disciplinas, ...series]
}

function filtrar(obras, filtro) {
	if (filtro.startsWith('disciplina:')) {
		const slug = filtro.slice('disciplina:'.length)
		return obras.filter((obra) => obra.disciplina?.slug === slug)
	}
	if (filtro.startsWith('serie:')) {
		const slug = filtro.slice('serie:'.length)
		return obras.filter((obra) => obra.serie?.slug === slug)
	}
	return obras
}

function filtroDesdeUrl(tabs) {
	const params = new URLSearchParams(window.location.search)
	const serie = params.get('serie')
	const disciplina = params.get('disciplina')
	const id = serie ? `serie:${serie}` : disciplina ? `disciplina:${disciplina}` : 'todas'
	return tabs.some((tab) => tab.id === id) ? id : 'todas'
}

function escribirUrl(filtro) {
	const url = new URL(window.location.href)
	url.searchParams.delete('serie')
	url.searchParams.delete('disciplina')
	if (filtro.startsWith('serie:')) url.searchParams.set('serie', filtro.slice('serie:'.length))
	if (filtro.startsWith('disciplina:')) url.searchParams.set('disciplina', filtro.slice('disciplina:'.length))
	const siguiente = `${url.pathname}${url.search}${url.hash}`
	if (siguiente !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
		window.history.replaceState(null, '', siguiente)
	}
}

function textoContador(cantidad) {
	return cantidad === 1 ? '1 obra' : `${cantidad} obras`
}

function cantidadDeColumnas(total, ancha) {
	if (total <= 6) return 2
	if (total <= 15) return 3
	return ancha ? 4 : 3
}

function repartir(obras, cantidad) {
	const columnas = COLUMNAS[cantidad].map((posicion, indice) => {
		const [desde, hasta] = posicion.split('/').map(Number)
		const ancho = (hasta - desde) * COLUMNA + (hasta - desde - 1) * SEPARACION
		return { posicion, ancho, alto: cantidad === 2 && indice === 1 ? DESFASAJE : 0, obras: [] }
	})
	obras.forEach((obra, orden) => {
		const destino = columnas.reduce((menor, columna) => (columna.alto < menor.alto ? columna : menor))
		const relacion = relacionDe({
			ancho: obra.imagen?.ancho || obra.relacion?.ancho,
			alto: obra.imagen?.alto || obra.relacion?.alto,
		})
		const proporcion = relacion.alto / relacion.ancho
		destino.alto += (destino.obras.length ? ENTRE_OBRAS : 0) + destino.ancho * proporcion + PIE
		destino.obras.push({ obra, orden })
	})
	return columnas
}

function Tarjeta({ obra, orden, sizes, prioridad }) {
	const imagenRef = useRef(null)
	const [cargada, setCargada] = useState(false)
	const [rota, setRota] = useState(false)
	const meta = [obra.serie?.nombre, obra.anio].filter(Boolean).join(' · ')
	const imagen = obra.imagen
	const relacion = relacionDe({
		ancho: imagen?.ancho || obra.relacion?.ancho,
		alto: imagen?.alto || obra.relacion?.alto,
	})

	useEffect(() => {
		if (imagenRef.current?.complete && imagenRef.current.naturalWidth > 0) setCargada(true)
	}, [])

	return (
		<article className="galeria-item" style={{ '--orden': orden }}>
			<a className="galeria-obra" href={`/obras/${obra.slug}`}>
				<span
					className="marco marco--obra galeria-obra__marco"
					style={{ aspectRatio: `${relacion.ancho} / ${relacion.alto}`, maxWidth: imagen ? `${imagen.ancho}px` : undefined }}
				>
					{imagen && !rota ? (
						<span
							className="lqip lqip--natural"
							style={{
								'--dominante': imagen.dominante || undefined,
								'--lqip': imagen.lqip ? `url("${imagen.lqip}")` : undefined,
							}}
						>
							<img
								ref={imagenRef}
								src={imagen.src}
								srcSet={imagen.srcset}
								sizes={sizes}
								alt={imagen.alt || obra.titulo}
								width={imagen.ancho}
								height={imagen.alto}
								loading={prioridad ? 'eager' : 'lazy'}
								fetchPriority={prioridad ? 'high' : 'auto'}
								decoding="async"
								data-nitida=""
								className={cargada ? 'is-nitida' : undefined}
								style={{ viewTransitionName: `obra-${obra.slug}` }}
								onLoad={() => setCargada(true)}
								onError={() => setRota(true)}
							/>
						</span>
					) : (
						<ObraPlaceholder llenar ancho={relacion.ancho} alto={relacion.alto} />
					)}
				</span>
				<h2 className="galeria-obra__titulo">
					<span className="titulo-obra">{obra.titulo}</span>
					<span className="galeria-obra__flecha" aria-hidden="true">
						→
					</span>
				</h2>
				{meta && <p className="galeria-obra__meta">{meta}</p>}
			</a>
		</article>
	)
}

function Muro({ obras, columnas, prioridadInicial = false }) {
	const distribucion = repartir(obras, columnas)
	const sizes =
		columnas === 2
			? '(min-width: 64rem) min(46vw, 830px), 50vw'
			: columnas === 3
				? '(min-width: 64rem) min(31vw, 540px), 50vw'
				: '(min-width: 64rem) min(23vw, 400px), 50vw'
	return (
		<div className={`galeria-muro galeria-muro--${columnas}${obras.length > 6 ? ' galeria-muro--densa' : ''}`}>
			{distribucion.map((columna) => (
				<div className="galeria-columna" key={columna.posicion} style={{ '--columna': columna.posicion }}>
					{columna.obras.map(({ obra, orden }) => (
						<Tarjeta
							key={obra.slug}
							obra={obra}
							orden={orden}
							sizes={sizes}
							prioridad={prioridadInicial && orden < 2}
						/>
					))}
				</div>
			))}
		</div>
	)
}

export default function Galeria({ obras = [] }) {
	const tabs = opciones(obras)
	const [filtro, setFiltro] = useState('todas')
	const [cambiando, setCambiando] = useState(false)
	const [ancha, setAncha] = useState(false)
	const espera = useRef(0)
	const tabsRef = useRef(null)

	const leido = useRef(false)

	useEffect(() => () => window.clearTimeout(espera.current), [])

	useEffect(() => {
		if (leido.current) return
		leido.current = true
		const desdeUrl = filtroDesdeUrl(opciones(obras))
		if (desdeUrl !== 'todas') setFiltro(desdeUrl)
	}, [obras])

	useEffect(() => {
		const consulta = window.matchMedia('(min-width: 90rem)')
		const actualizar = () => setAncha(consulta.matches)
		actualizar()
		consulta.addEventListener('change', actualizar)
		return () => consulta.removeEventListener('change', actualizar)
	}, [])

	function elegir(siguiente) {
		if (siguiente === filtro) return
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		window.clearTimeout(espera.current)
		const aplicar = () => {
			setFiltro(siguiente)
			escribirUrl(siguiente)
			setCambiando(false)
		}
		if (reduce) {
			aplicar()
			return
		}
		setCambiando(true)
		espera.current = window.setTimeout(() => {
			setFiltro(siguiente)
			escribirUrl(siguiente)
			espera.current = window.setTimeout(() => setCambiando(false), 20)
		}, 200)
	}

	function teclado(event) {
		if (tabs.length < 2) return
		const ids = tabs.map((tab) => tab.id)
		const actual = Math.max(0, ids.indexOf(filtro))
		let destino = actual
		if (event.key === 'ArrowRight') destino = (actual + 1) % ids.length
		else if (event.key === 'ArrowLeft') destino = (actual - 1 + ids.length) % ids.length
		else if (event.key === 'Home') destino = 0
		else if (event.key === 'End') destino = ids.length - 1
		else return
		event.preventDefault()
		elegir(ids[destino])
		tabsRef.current?.querySelectorAll('[role="tab"]')[destino]?.focus()
	}

	const visibles = filtrar(obras, filtro)
	const columnas = cantidadDeColumnas(Math.max(visibles.length, 1), ancha)
	const etiqueta = tabs.find((tab) => tab.id === filtro)?.label

	return (
		<div className="galeria">
			<div className="galeria-barra">
				{tabs.length > 0 && (
					<div
						ref={tabsRef}
						className="galeria-tabs"
						role="tablist"
						aria-label="Filtrar obras"
						onKeyDown={teclado}
					>
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								role="tab"
								className={tab.grupo ? 'galeria-tab galeria-tab--grupo' : 'galeria-tab'}
								aria-selected={filtro === tab.id}
								tabIndex={filtro === tab.id ? 0 : -1}
								onClick={() => elegir(tab.id)}
							>
								{tab.label}
							</button>
						))}
					</div>
				)}
				<p className="galeria-cuenta" aria-live="polite">
					{textoContador(visibles.length)}
					{etiqueta && etiqueta !== 'Todas' ? ` · ${etiqueta}` : ''}
				</p>
			</div>

			<div id="galeria-resultados" className={cambiando ? 'galeria-resultados is-cambiando' : 'galeria-resultados'}>
				{visibles.length === 0 && <p className="galeria-vacia">No hay obras en esta selección.</p>}
				{visibles.length > 0 && <Muro obras={visibles} columnas={columnas} prioridadInicial />}
			</div>
		</div>
	)
}
