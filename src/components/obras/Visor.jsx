import { useEffect, useRef, useState } from 'react'

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

export default function Visor({ imagenes = [], titulo = '', slug = '' }) {
	const [indice, setIndice] = useState(0)
	const [visible, setVisible] = useState(true)
	const [abierto, setAbierto] = useState(false)
	const espera = useRef(0)
	const indiceRef = useRef(0)
	const escena = useRef(null)
	const cerrarBtn = useRef(null)
	const total = imagenes.length
	const actual = imagenes[indice] || null

	useEffect(() => () => window.clearTimeout(espera.current), [])

	function ir(destino) {
		if (total < 2) return
		const siguiente = ((destino % total) + total) % total
		if (siguiente === indiceRef.current) return
		window.clearTimeout(espera.current)
		const aplicar = () => {
			indiceRef.current = siguiente
			setIndice(siguiente)
			setVisible(true)
		}
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		if (reduce) {
			aplicar()
			return
		}
		setVisible(false)
		espera.current = window.setTimeout(aplicar, 180)
	}

	useEffect(() => {
		if (!abierto) return undefined
		const overflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		cerrarBtn.current?.focus()

		function tecla(event) {
			if (event.key === 'Escape') {
				event.preventDefault()
				setAbierto(false)
				escena.current?.focus()
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault()
				ir(indiceRef.current + 1)
			}
			if (event.key === 'ArrowLeft') {
				event.preventDefault()
				ir(indiceRef.current - 1)
			}
		}

		window.addEventListener('keydown', tecla)
		return () => {
			document.body.style.overflow = overflow
			window.removeEventListener('keydown', tecla)
		}
	}, [abierto])

	function cerrar() {
		setAbierto(false)
		escena.current?.focus()
	}

	if (!actual) return null

	const claseImg = visible ? 'visor__img' : 'visor__img is-fuera'
	const claseLightbox = visible ? 'lightbox__img' : 'lightbox__img is-fuera'

	return (
		<div className="visor">
			{/* Detrás de la obra, su color dominante muy tenue sobre el fondo: ocupa todo el ancho de la columna. */}
			<button
				ref={escena}
				type="button"
				className="visor__escena"
				style={{ '--dominante': actual.dominante || undefined }}
				onClick={() => setAbierto(true)}
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
				/>
			</button>

			{total > 1 && (
				<ul className="visor__minis" aria-label="Imágenes de la obra">
					{imagenes.map((imagen, i) => (
						<li key={`${imagen.thumb}-${i}`}>
							<button
								type="button"
								className="visor__mini"
								aria-pressed={i === indice}
								aria-label={imagen.alt || `Imagen ${i + 1}`}
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
			)}

			{abierto && (
				<div
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
					<img
						className={claseLightbox}
						src={actual.lightbox || actual.src}
						srcSet={actual.lightboxSrcset}
						sizes="100vw"
						alt={actual.alt || titulo}
						width={actual.ancho}
						height={actual.alto}
						decoding="async"
						style={{ maxWidth: `min(100%, ${actual.ancho}px)` }}
						onClick={(event) => event.stopPropagation()}
					/>
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
				</div>
			)}
		</div>
	)
}
