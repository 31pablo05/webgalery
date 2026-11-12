import { useEffect, useRef, useState } from 'react'
import ObraPlaceholder from './ObraPlaceholder.jsx'
import { relacionDe } from '../../lib/proporcion.js'

function IconoCerrar() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.25" />
		</svg>
	)
}

function IconoFlecha({ sentido }) {
	const d = sentido === 'anterior' ? 'M14 6l-6 6 6 6' : 'M10 6l6 6-6 6'
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d={d} fill="none" stroke="currentColor" strokeWidth="1.25" />
		</svg>
	)
}

function distancia(toques) {
	const dx = toques[0].clientX - toques[1].clientX
	const dy = toques[0].clientY - toques[1].clientY
	return Math.hypot(dx, dy)
}

export default function Visor({ imagenes = [], titulo = '', slug = '', relacion = null }) {
	const [indice, setIndice] = useState(0)
	const [visible, setVisible] = useState(true)
	const [abierto, setAbierto] = useState(false)
	const [zoom, setZoom] = useState(1)
	const [origen, setOrigen] = useState({ x: 0, y: 0 })
	const [rotas, setRotas] = useState(() => new Set())
	const espera = useRef(0)
	const indiceRef = useRef(0)
	const zoomRef = useRef(1)
	const escena = useRef(null)
	const dialogo = useRef(null)
	const marcoZoom = useRef(null)
	const cerrarBtn = useRef(null)
	const retorno = useRef(null)
	const gesto = useRef(null)
	const total = imagenes.length
	const actual = imagenes[indice] || null

	useEffect(() => () => window.clearTimeout(espera.current), [])

	function fijarZoom(valor) {
		const siguiente = Math.min(3, Math.max(1, Math.round(valor * 100) / 100))
		zoomRef.current = siguiente
		setZoom(siguiente)
		if (siguiente === 1) setOrigen({ x: 0, y: 0 })
	}

	function ir(destino) {
		if (total < 2) return
		const siguiente = ((destino % total) + total) % total
		if (siguiente === indiceRef.current) return
		window.clearTimeout(espera.current)
		const aplicar = () => {
			indiceRef.current = siguiente
			setIndice(siguiente)
			setVisible(true)
			fijarZoom(1)
		}
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		if (reduce) {
			aplicar()
			return
		}
		setVisible(false)
		espera.current = window.setTimeout(aplicar, 180)
	}

	function cerrar() {
		setAbierto(false)
		fijarZoom(1)
		const destino = retorno.current || escena.current
		window.requestAnimationFrame(() => destino?.focus?.())
	}

	useEffect(() => {
		if (!abierto) return undefined
		const overflowBody = document.body.style.overflow
		const overflowHtml = document.documentElement.style.overflow
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'
		cerrarBtn.current?.focus()

		function tecla(event) {
			if (event.key === 'Escape') {
				event.preventDefault()
				cerrar()
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault()
				ir(indiceRef.current + 1)
			}
			if (event.key === 'ArrowLeft') {
				event.preventDefault()
				ir(indiceRef.current - 1)
			}
			if (event.key === '+' || event.key === '=') {
				event.preventDefault()
				fijarZoom(zoomRef.current + 0.5)
			}
			if (event.key === '-' || event.key === '_') {
				event.preventDefault()
				fijarZoom(zoomRef.current - 0.5)
			}
			if (event.key === '0') {
				event.preventDefault()
				fijarZoom(1)
			}
			if (event.key !== 'Tab' || !dialogo.current) return
			const focables = [...dialogo.current.querySelectorAll('button:not([disabled])')].filter(
				(elemento) => !elemento.hasAttribute('disabled'),
			)
			if (focables.length === 0) return
			const primero = focables[0]
			const ultimo = focables[focables.length - 1]
			if (event.shiftKey && document.activeElement === primero) {
				event.preventDefault()
				ultimo.focus()
			} else if (!event.shiftKey && document.activeElement === ultimo) {
				event.preventDefault()
				primero.focus()
			}
		}

		window.addEventListener('keydown', tecla)
		return () => {
			document.body.style.overflow = overflowBody
			document.documentElement.style.overflow = overflowHtml
			window.removeEventListener('keydown', tecla)
		}
	}, [abierto])

	useEffect(() => {
		const marco = marcoZoom.current
		if (!abierto || !marco) return undefined

		function empezar(event) {
			if (event.touches.length === 2) {
				gesto.current = { pinza: distancia(event.touches), zoom: zoomRef.current, modo: 'pinza' }
			}
		}

		function mover(event) {
			if (event.touches.length !== 2 || gesto.current?.modo !== 'pinza' || !gesto.current.pinza) return
			event.preventDefault()
			fijarZoom((gesto.current.zoom * distancia(event.touches)) / gesto.current.pinza)
		}

		function terminar() {
			if (gesto.current?.modo === 'pinza') gesto.current = null
		}

		marco.addEventListener('touchstart', empezar, { passive: true })
		marco.addEventListener('touchmove', mover, { passive: false })
		marco.addEventListener('touchend', terminar)
		return () => {
			marco.removeEventListener('touchstart', empezar)
			marco.removeEventListener('touchmove', mover)
			marco.removeEventListener('touchend', terminar)
		}
	}, [abierto, indice])

	function apuntar(event) {
		if (event.pointerType === 'mouse' && event.button !== 0) return
		if (event.target.closest('button')) return
		gesto.current = {
			x: event.clientX,
			y: event.clientY,
			ox: origen.x,
			oy: origen.y,
			modo: zoomRef.current > 1 ? 'mover' : 'deslizar',
		}
	}

	function soltar(event) {
		const inicio = gesto.current
		gesto.current = null
		if (!inicio || inicio.modo === 'pinza') return
		const dx = event.clientX - inicio.x
		const dy = event.clientY - inicio.y
		if (inicio.modo === 'deslizar' && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
			ir(indiceRef.current + (dx < 0 ? 1 : -1))
		}
	}

	function arrastrar(event) {
		const inicio = gesto.current
		if (!inicio || inicio.modo !== 'mover') return
		setOrigen({ x: inicio.ox + event.clientX - inicio.x, y: inicio.oy + event.clientY - inicio.y })
	}

	function abrir() {
		retorno.current = document.activeElement
		setAbierto(true)
	}

	const marco = relacionDe({ ancho: actual?.ancho || relacion?.ancho, alto: actual?.alto || relacion?.alto })
	const rota = actual ? rotas.has(indice) : false

	if (!actual) {
		return (
			<div className="visor">
				<div className="visor__escena marco marco--ficha" style={{ cursor: 'default' }}>
					<ObraPlaceholder titulo={titulo} ancho={marco.ancho} alto={marco.alto} />
				</div>
			</div>
		)
	}

	const claseImg = visible ? 'visor__img' : 'visor__img is-fuera'
	const claseLightbox = visible ? 'lightbox__img' : 'lightbox__img is-fuera'

	return (
		<div className="visor">
			{rota ? (
				<div className="visor__escena marco marco--ficha" style={{ cursor: 'default' }}>
					<ObraPlaceholder titulo={titulo} ancho={marco.ancho} alto={marco.alto} />
				</div>
			) : (
				<button
					ref={escena}
					type="button"
					className="visor__escena"
					style={{ '--dominante': actual.dominante || undefined }}
					onClick={abrir}
					aria-label={`Ampliar ${actual.alt || titulo}`}
				>
					<img
						className={claseImg}
						src={actual.src}
						srcSet={actual.srcset}
						sizes="(min-width: 64rem) min(55vw, 980px), 100vw"
						alt={actual.alt || titulo}
						width={actual.ancho}
						height={actual.alto}
						loading="eager"
						fetchPriority="high"
						decoding="async"
						style={{
							maxWidth: `min(100%, ${actual.ancho}px)`,
							viewTransitionName: slug ? `obra-${slug}` : undefined,
						}}
						onError={() => setRotas((previas) => new Set(previas).add(indice))}
					/>
				</button>
			)}

			{total > 1 && (
				<div className="visor__pie">
					<ul className="visor__minis" aria-label="Imágenes de la obra">
						{imagenes.map((imagen, i) => (
							<li key={`${imagen.thumb}-${i}`}>
								<button
									type="button"
									className="visor__mini"
									aria-pressed={i === indice}
									aria-label={imagen.alt || `Imagen ${i + 1} de ${total}`}
									onClick={() => ir(i)}
								>
									<img
										src={imagen.thumb}
										srcSet={imagen.thumbSrcset}
										sizes="3.5rem"
										alt=""
										width="180"
										height="180"
										loading="lazy"
										decoding="async"
									/>
								</button>
							</li>
						))}
					</ul>
					<p className="visor__cuenta" aria-live="polite">
						{indice + 1} / {total}
					</p>
				</div>
			)}

			{abierto && !rota && (
				<div
					ref={dialogo}
					className="lightbox"
					role="dialog"
					aria-modal="true"
					aria-label={titulo || 'Imagen ampliada'}
					onClick={cerrar}
				>
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
					{total > 1 && (
						<button
							type="button"
							className="lightbox__btn lightbox__anterior"
							aria-label="Imagen anterior"
							onClick={(event) => {
								event.stopPropagation()
								ir(indice - 1)
							}}
						>
							<IconoFlecha sentido="anterior" />
						</button>
					)}
					<div
						ref={marcoZoom}
						className="lightbox__marco"
						onPointerDown={apuntar}
						onPointerUp={soltar}
						onPointerMove={arrastrar}
						onPointerCancel={() => {
							gesto.current = null
						}}
						onClick={(event) => {
							event.stopPropagation()
							if (event.target === event.currentTarget) cerrar()
						}}
					>
						<img
							className={claseLightbox}
							src={actual.lightbox || actual.src}
							srcSet={actual.lightboxSrcset}
							sizes="100vw"
							alt={actual.alt || titulo}
							width={actual.ancho}
							height={actual.alto}
							decoding="async"
							draggable="false"
							style={{
								maxWidth: `min(100%, ${actual.ancho}px)`,
								transform: `translate(${origen.x}px, ${origen.y}px) scale(${zoom})`,
							}}
						/>
					</div>
					{total > 1 && (
						<button
							type="button"
							className="lightbox__btn lightbox__siguiente"
							aria-label="Imagen siguiente"
							onClick={(event) => {
								event.stopPropagation()
								ir(indice + 1)
							}}
						>
							<IconoFlecha sentido="siguiente" />
						</button>
					)}
					<div className="lightbox__herramientas" onClick={(event) => event.stopPropagation()}>
						<div className="lightbox__zoom" role="group" aria-label="Zoom">
							<button type="button" className="lightbox__btn" aria-label="Alejar" disabled={zoom <= 1} onClick={() => fijarZoom(zoom - 0.5)}>
								−
							</button>
							<button type="button" className="lightbox__btn" aria-label="Acercar" disabled={zoom >= 3} onClick={() => fijarZoom(zoom + 0.5)}>
								+
							</button>
						</div>
						{total > 1 && (
							<p className="lightbox__cuenta" aria-live="polite">
								{indice + 1} / {total}
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
