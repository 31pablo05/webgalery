import { useEffect, useRef, useState } from 'react'

const CATEGORIAS = [
	{ id: 'dibujo', label: 'Dibujo' },
	{ id: 'obra-bidimensional', label: 'Obra bidimensional' },
	{ id: 'experimentacion-grafica', label: 'Experimentación gráfica' },
	{ id: 'intervencion', label: 'Intervención' },
]

// Solo se ofrecen los filtros que tienen obras; con menos de dos categorías no hay barra.
function pestanias(obras) {
	const categorias = CATEGORIAS.filter((categoria) => obras.some((obra) => obra.categoria === categoria.id))
	if (categorias.length < 2) return []
	const series = obras.some((obra) => obra.serie) ? [{ id: 'series', label: 'Series' }] : []
	return [{ id: 'todas', label: 'Todas' }, ...categorias, ...series]
}

const ESTADOS = {
	disponible: { marca: '●', texto: 'Disponible', tenue: false },
	reservada: { marca: '○', texto: 'Reservada', tenue: false },
	vendida: { marca: '', texto: 'Vendida', tenue: true },
}

function metaDe(obra) {
	return [obra.anio, obra.tecnica, obra.dimensiones].filter(Boolean).join(' · ')
}

function filtrar(obras, filtro) {
	if (filtro === 'series') return obras.filter((obra) => obra.serie)
	if (filtro !== 'todas') return obras.filter((obra) => obra.categoria === filtro)
	return obras
}

function agrupar(obras) {
	const grupos = []
	const indice = new Map()
	for (const obra of obras) {
		if (!indice.has(obra.serie)) {
			indice.set(obra.serie, grupos.length)
			grupos.push({ nombre: obra.serie, obras: [] })
		}
		grupos[indice.get(obra.serie)].obras.push(obra)
	}
	return grupos
}

function textoContador(cantidad) {
	if (cantidad === 1) return '1 obra'
	return `${cantidad} obras`
}

function Ficha({ obra }) {
	const estado = ESTADOS[obra.estado]
	const meta = metaDe(obra)
	return (
		<div className="obra-ficha">
			<div className="obra-ficha__fila">
				<div>
					<p className="obra-ficha__titulo">{obra.titulo}</p>
					{meta && <p className="obra-ficha__meta">{meta}</p>}
				</div>
				<div className="obra-ficha__estado">
					{estado && (
						<p className={estado.tenue ? 'obra-ficha__meta' : undefined}>
							{estado.marca && <span aria-hidden="true">{estado.marca}</span>}
							{estado.texto}
						</p>
					)}
					<p>
						Ver obra <span className="arrow" aria-hidden="true">→</span>
					</p>
				</div>
			</div>
		</div>
	)
}

function Tarjeta({ obra, prioridad = false }) {
	return (
		<li>
			<a className="galeria-obra" href={`/obras/${obra.slug}`}>
				<div className="galeria-obra__marco">
					{obra.imagen && (
						<img
							src={obra.imagen.src}
							srcSet={obra.imagen.srcset}
							sizes="(min-width: 64rem) 22vw, (min-width: 48rem) 46vw, 92vw"
							alt={obra.imagen.alt || obra.titulo}
							width={obra.imagen.ancho}
							height={obra.imagen.alto}
							loading={prioridad ? 'eager' : 'lazy'}
							fetchPriority={prioridad ? 'high' : 'auto'}
							decoding="async"
							className="galeria-obra__img"
						/>
					)}
				</div>
				<Ficha obra={obra} />
			</a>
		</li>
	)
}

function Muro({ obras, prioridadInicial = false }) {
	return (
		<ul className="galeria-muro">
			{obras.map((obra, indice) => (
				<Tarjeta key={obra.slug} obra={obra} prioridad={prioridadInicial && indice === 0} />
			))}
		</ul>
	)
}

export default function Galeria({ obras = [] }) {
	const [filtro, setFiltro] = useState('todas')
	const [cambiando, setCambiando] = useState(false)
	const espera = useRef(0)

	useEffect(() => () => window.clearTimeout(espera.current), [])

	function elegir(siguiente) {
		if (siguiente === filtro) return
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		window.clearTimeout(espera.current)
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

	const tabs = pestanias(obras)
	const visibles = filtrar(obras, filtro)
	const grupos = filtro === 'series' ? agrupar(visibles) : []

	return (
		<div>
			{tabs.length > 0 && (
			<div className="galeria-barra">
				<div className="galeria-tabs" role="tablist" aria-label="Filtrar obras">
					{tabs.map((tab, index) => (
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
				<span className="galeria-barra__linea" aria-hidden="true" />
				<p className="label galeria-barra__cuenta" aria-live="polite">
					{textoContador(visibles.length)}
				</p>
			</div>
			)}

			<div
				className={['galeria-resultados', cambiando && 'is-cambiando', tabs.length > 0 && 'mt-10']
					.filter(Boolean)
					.join(' ')}
			>
				{visibles.length === 0 && (
					<p className="obra-ficha__vacia">No hay obras en esta selección.</p>
				)}
				{filtro === 'series'
					? grupos.map((grupo, indice) => (
							<section key={grupo.nombre} className="mb-14">
								<h2 className="galeria-obra__serie">{grupo.nombre}</h2>
								<Muro obras={grupo.obras} prioridadInicial={indice === 0} />
							</section>
						))
					: <Muro obras={visibles} prioridadInicial />}
			</div>
		</div>
	)
}
