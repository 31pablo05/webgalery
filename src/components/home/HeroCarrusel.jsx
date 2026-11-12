import { useCallback, useEffect, useRef, useState } from 'react'
import ObraPlaceholder from '../obras/ObraPlaceholder.jsx'

/*
	Carrusel del hero. Astro lo renderiza en el servidor (la primera diapositiva es el LCP y sale en el
	HTML con prioridad alta); al hidratar, el island solo agrega la interacción.
	diapositivas: [{ id, etiqueta, titulo, subtitulo, textoBoton, enlace, externo, imagen }]
	imagen: { src, srcset, alt, ancho, alto, posicion, posicionMovil }
	autoplay: desactivado por defecto. Si se activa, se pausa con hover, foco o pestaña oculta.
*/

const INTERVALO = 7000
const UMBRAL_DESLIZAR = 40

function Flecha() {
	return (
		<svg className="flecha" viewBox="0 0 22 10" aria-hidden="true" focusable="false">
			<path d="M0 5h20.5M16.5 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function Chevron({ sentido }) {
	return (
		<svg viewBox="0 0 14 28" aria-hidden="true" focusable="false">
			<path d={sentido === 'anterior' ? 'M12 2 2 14l10 12' : 'M2 2l10 12L2 26'} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

function Diapositiva({ diapositiva, indice, activa, total }) {
	const { etiqueta, titulo, subtitulo, textoBoton, enlace, externo, imagen } = diapositiva
	const [rota, setRota] = useState(false)
	const primera = indice === 0
	const Titulo = primera ? 'h1' : 'h2'
	const conFoto = Boolean(imagen?.src) && !rota
	return (
		<div
			className={activa ? 'hero__diapositiva is-activa' : 'hero__diapositiva'}
			role={total > 1 ? 'group' : undefined}
			aria-roledescription={total > 1 ? 'diapositiva' : undefined}
			aria-label={total > 1 ? `${indice + 1} de ${total}` : undefined}
			aria-hidden={activa ? undefined : 'true'}
			inert={activa ? undefined : true}
		>
			<figure
				className={imagen?.contenida ? 'hero__figura hero__figura--contenida' : 'hero__figura'}
				style={imagen?.contenida ? { '--ancho-nativo': `${imagen.ancho}px` } : undefined}
			>
				{conFoto ? (
					<img
						src={imagen.src}
						srcSet={imagen.srcset || undefined}
						sizes="(min-width: 64rem) 72vw, 100vw"
						alt={imagen.alt}
						width={imagen.ancho}
						height={imagen.alto}
						loading={primera ? 'eager' : 'lazy'}
						fetchPriority={primera ? 'high' : 'low'}
						decoding={primera ? 'sync' : 'async'}
						style={{ '--posicion': imagen.posicion, '--posicion-movil': imagen.posicionMovil }}
						onError={() => setRota(true)}
					/>
				) : (
					<ObraPlaceholder proporcion="horizontal" className="hero__pendiente" />
				)}
			</figure>
			<div className="hero__texto contenedor">
				<div className="hero__bloque">
					{etiqueta && <p className="label label--acento hero__etiqueta">{etiqueta}</p>}
					{titulo && <Titulo className="t-hero hero__titulo">{titulo}</Titulo>}
					<span className="filete filete--largo hero__filete" aria-hidden="true" />
					{subtitulo && <p className="hero__subtitulo">{subtitulo}</p>}
					{textoBoton && enlace && (
						<a
							className="btn btn-contorno hero__boton"
							href={enlace}
							target={externo ? '_blank' : undefined}
							rel={externo ? 'noopener noreferrer' : undefined}
						>
							{textoBoton}
							<Flecha />
						</a>
					)}
				</div>
			</div>
		</div>
	)
}

export default function HeroCarrusel({ diapositivas = [], autoplay = false }) {
	const total = diapositivas.length
	const [actual, setActual] = useState(0)
	const [pausado, setPausado] = useState(false)
	const inicioToque = useRef(null)

	const ir = useCallback(
		(indice) => {
			if (total < 2) return
			setActual(((indice % total) + total) % total)
		},
		[total],
	)

	// Autoplay opcional: nunca con movimiento reducido; se pausa con hover, foco o pestaña oculta.
	useEffect(() => {
		if (!autoplay || total < 2 || pausado) return undefined
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
		const id = window.setInterval(() => {
			if (!document.hidden) setActual((valor) => (valor + 1) % total)
		}, INTERVALO)
		return () => window.clearInterval(id)
	}, [autoplay, total, pausado])

	if (!total) return null
	const varias = total > 1

	function tecla(event) {
		if (!varias) return
		if (event.key === 'ArrowLeft') {
			event.preventDefault()
			ir(actual - 1)
		} else if (event.key === 'ArrowRight') {
			event.preventDefault()
			ir(actual + 1)
		}
	}

	function tocar(event) {
		const toque = event.touches[0]
		inicioToque.current = toque ? { x: toque.clientX, y: toque.clientY } : null
	}

	function soltar(event) {
		const inicio = inicioToque.current
		const toque = event.changedTouches[0]
		inicioToque.current = null
		if (!varias || !inicio || !toque) return
		const dx = toque.clientX - inicio.x
		const dy = toque.clientY - inicio.y
		if (Math.abs(dx) < UMBRAL_DESLIZAR || Math.abs(dx) < Math.abs(dy)) return
		ir(actual + (dx < 0 ? 1 : -1))
	}

	return (
		<div
			className="hero__carrusel"
			role={varias ? 'region' : undefined}
			aria-roledescription={varias ? 'carrusel' : undefined}
			aria-label={varias ? 'Destacados' : undefined}
			tabIndex={varias ? 0 : undefined}
			onKeyDown={tecla}
			onTouchStart={tocar}
			onTouchEnd={soltar}
			onMouseEnter={() => setPausado(true)}
			onMouseLeave={() => setPausado(false)}
			onFocus={() => setPausado(true)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setPausado(false)
			}}
		>
			<div className="hero__pista" aria-live={varias && !autoplay ? 'polite' : 'off'}>
				{diapositivas.map((diapositiva, indice) => (
					<Diapositiva key={diapositiva.id || indice} diapositiva={diapositiva} indice={indice} activa={indice === actual} total={total} />
				))}
			</div>

			{varias && (
				<>
					<button type="button" className="hero__flecha hero__flecha--anterior" aria-label="Diapositiva anterior" onClick={() => ir(actual - 1)}>
						<Chevron sentido="anterior" />
					</button>
					<button type="button" className="hero__flecha hero__flecha--siguiente" aria-label="Diapositiva siguiente" onClick={() => ir(actual + 1)}>
						<Chevron sentido="siguiente" />
					</button>
					<div className="hero__puntos">
						{diapositivas.map((diapositiva, indice) => (
							<button
								key={diapositiva.id || indice}
								type="button"
								className="hero__punto"
								aria-label={`Ir a la diapositiva ${indice + 1} de ${total}`}
								aria-current={indice === actual ? 'true' : undefined}
								onClick={() => ir(indice)}
							/>
						))}
					</div>
				</>
			)}
		</div>
	)
}
