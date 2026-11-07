import { useEffect, useRef, useState } from 'react'

const CATEGORIAS = [
	{ id: 'dibujo', label: 'Dibujo' },
	{ id: 'instalacion', label: 'Instalación' },
	{ id: 'experimentacion-grafica', label: 'Experimentación gráfica' },
	{ id: 'obra-bidimensional', label: 'Obra bidimensional' },
]

// Columnas de escritorio sobre la grilla de 12, según cuántas obras hay.
const COLUMNAS = {
	2: ['1 / 7', '8 / 13'],
	3: ['1 / 5', '5 / 9', '9 / 13'],
	4: ['1 / 4', '4 / 7', '7 / 10', '10 / 13'],
}

// Medidas de referencia (grilla de 1440 px) para repartir las obras sin dejar huecos.
const COLUMNA = 91.3
const SEPARACION = 24
const PIE = 64
const ENTRE_OBRAS = 80
const DESFASAJE = 160

// Solo se ofrecen los filtros que tienen obras; con menos de dos categorías no hay barra.
function pestanias(obras) {
	const categorias = CATEGORIAS.filter((categoria) => obras.some((obra) => obra.categoria === categoria.id))
	if (categorias.length < 2) return []
	const proyectos = obras.some((obra) => obra.proyecto) ? [{ id: 'proyectos', label: 'Proyectos' }] : []
	return [{ id: 'todas', label: 'Todas' }, ...categorias, ...proyectos]
}

function filtrar(obras, filtro) {
	if (filtro === 'proyectos') return obras.filter((obra) => obra.proyecto)
	if (filtro !== 'todas') return obras.filter((obra) => obra.categoria === filtro)
	return obras
}

function agrupar(obras) {
	const grupos = []
	const indice = new Map()
	for (const obra of obras) {
		if (!indice.has(obra.proyecto)) {
			indice.set(obra.proyecto, grupos.length)
			grupos.push({ nombre: obra.proyecto, obras: [] })
		}
		grupos[indice.get(obra.proyecto)].obras.push(obra)
	}
	return grupos
}

function textoContador(cantidad) {
	return cantidad === 1 ? '1 obra' : `${cantidad} obras`
}

function cantidadDeColumnas(total, ancha) {
	if (total <= 6) return 2
	if (total <= 15) return 3
	return ancha ? 4 : 3
}

// Cada obra va a la columna más corta; así ninguna columna queda con un hueco grande al final.
function repartir(obras, cantidad) {
	const columnas = COLUMNAS[cantidad].map((posicion, indice) => {
		const [desde, hasta] = posicion.split('/').map(Number)
		const ancho = (hasta - desde) * COLUMNA + (hasta - desde - 1) * SEPARACION
		return { posicion, ancho, alto: cantidad === 2 && indice === 1 ? DESFASAJE : 0, obras: [] }
	})
	obras.forEach((obra, orden) => {
		const destino = columnas.reduce((menor, columna) => (columna.alto < menor.alto ? columna : menor))
		const proporcion = obra.imagen ? obra.imagen.alto / obra.imagen.ancho : 1
		destino.alto += (destino.obras.length ? ENTRE_OBRAS : 0) + destino.ancho * proporcion + PIE
		destino.obras.push({ obra, orden })
	})
	return columnas
}

function Tarjeta({ obra, orden, sizes, prioridad }) {
	const imagenRef = useRef(null)
	const [cargada, setCargada] = useState(false)
	const meta = [obra.proyecto, obra.anio].filter(Boolean).join(' · ')
	const imagen = obra.imagen

	useEffect(() => {
		if (imagenRef.current?.complete) setCargada(true)
	}, [])

	return (
		<article className="galeria-item" style={{ '--orden': orden }}>
			<a className="galeria-obra" href={`/obras/${obra.slug}`}>
				{imagen && (
					<span
						className="lqip lqip--natural galeria-obra__marco"
						style={{
							'--dominante': imagen.dominante || undefined,
							'--lqip': imagen.lqip ? `url("${imagen.lqip}")` : undefined,
							maxWidth: `${imagen.ancho}px`,
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
							onError={() => setCargada(true)}
						/>
					</span>
				)}
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
			? '(min-width: 64rem) min(46vw, 830px), 100vw'
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
	const [filtro, setFiltro] = useState('todas')
	const [cambiando, setCambiando] = useState(false)
	const [ancha, setAncha] = useState(false)
	const espera = useRef(0)

	useEffect(() => () => window.clearTimeout(espera.current), [])

	// Las cuatro columnas solo aparecen con más de 15 obras y en pantallas de 1440 px o más.
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
	const columnas = cantidadDeColumnas(visibles.length, ancha)
	const grupos = filtro === 'proyectos' ? agrupar(visibles) : []

	return (
		<div className="galeria">
			<div className="galeria-barra">
				{tabs.length > 0 && (
					<div className="galeria-tabs" role="tablist" aria-label="Filtrar obras">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								role="tab"
								className="galeria-tab"
								aria-selected={filtro === tab.id}
								onClick={() => elegir(tab.id)}
							>
								{tab.label}
							</button>
						))}
					</div>
				)}
				<p className="galeria-cuenta" aria-live="polite">
					{textoContador(visibles.length)}
				</p>
			</div>

			<div className={cambiando ? 'galeria-resultados is-cambiando' : 'galeria-resultados'}>
				{visibles.length === 0 && <p className="galeria-vacia">No hay obras en esta selección.</p>}
				{filtro === 'proyectos'
					? grupos.map((grupo, indice) => (
							<section key={grupo.nombre} className="galeria-grupo">
								<h2 className="galeria-grupo__titulo">{grupo.nombre}</h2>
								<Muro
									obras={grupo.obras}
									columnas={cantidadDeColumnas(grupo.obras.length, ancha)}
									prioridadInicial={indice === 0}
								/>
							</section>
						))
					: visibles.length > 0 && <Muro obras={visibles} columnas={columnas} prioridadInicial />}
			</div>
		</div>
	)
}
