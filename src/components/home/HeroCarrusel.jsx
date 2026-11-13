import { useCallback, useEffect, useRef, useState } from 'react'

/*
	Fondo del hero: fotos y videos cortos a pantalla completa, con fundido cruzado.
	El texto NO vive acá: lo renderiza Hero.astro y no cambia con las diapositivas.

	diapositivas: [{ id, tipo: 'imagen' | 'video', video, epigrafe, imagen: { src, srcset, alt, posicion } }]

	- Foto: queda DURACION_FOTO ms con un acercamiento lentísimo.
	- Video: silenciado, sin controles; dura lo que dura el clip y al terminar pasa a la siguiente.
	  Solo se reproduce el video de la diapositiva activa; al salir se pausa y vuelve al inicio.
	  El archivo se pide recién cuando la diapositiva activa o la siguiente es esa (nunca al cargar la página).
	- Se pausa con el botón, con el mouse o el foco sobre los controles y con la pestaña oculta.
	- Con movimiento reducido o ahorro de datos: sin autoplay, sin zoom y sin videos (se ve su póster).
*/

const DURACION_FOTO = 6000
const DURACION_VIDEO_MAX = 12000

function usarPreferencias() {
	const [reducido, setReducido] = useState(false)
	const [ahorro, setAhorro] = useState(false)
	useEffect(() => {
		const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
		const actualizar = () => setReducido(consulta.matches)
		actualizar()
		consulta.addEventListener('change', actualizar)
		setAhorro(Boolean(navigator.connection?.saveData))
		return () => consulta.removeEventListener('change', actualizar)
	}, [])
	return { reducido, ahorro }
}

function IconoPausa({ pausado }) {
	return pausado ? (
		<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
			<path d="M3 1.5v9l7.5-4.5z" fill="currentColor" />
		</svg>
	) : (
		<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
			<path d="M3 1.5h2v9H3zM7 1.5h2v9H7z" fill="currentColor" />
		</svg>
	)
}

function Chevron({ sentido }) {
	return (
		<svg viewBox="0 0 14 28" aria-hidden="true" focusable="false">
			<path
				d={sentido === 'anterior' ? 'M12 2 2 14l10 12' : 'M2 2l10 12L2 26'}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.1"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export default function HeroCarrusel({ diapositivas = [] }) {
	const total = diapositivas.length
	const [actual, setActual] = useState(0)
	const [pausaManual, setPausaManual] = useState(false)
	const [pausaHover, setPausaHover] = useState(false)
	const [oculto, setOculto] = useState(false)
	const [videosFallidos, setVideosFallidos] = useState(() => new Set())
	const [listo, setListo] = useState(false)
	const { reducido, ahorro } = usarPreferencias()

	const videos = useRef([])
	const barras = useRef([])
	const transcurrido = useRef(0)

	const varias = total > 1
	const sinMovimiento = reducido
	const conVideos = listo && !reducido && !ahorro
	const pausado = pausaManual || pausaHover || oculto || sinMovimiento || !varias

	const actualDatos = diapositivas[actual]
	const esVideoActivo = conVideos && actualDatos?.tipo === 'video' && !videosFallidos.has(actual)

	const ir = useCallback(
		(indice) => {
			if (total < 2) return
			transcurrido.current = 0
			setActual(((indice % total) + total) % total)
		},
		[total],
	)

	// Después de hidratar: recién ahí se habilitan los videos (el HTML del servidor solo trae la primera foto).
	useEffect(() => {
		setListo(true)
		const visibilidad = () => setOculto(document.hidden)
		document.addEventListener('visibilitychange', visibilidad)
		return () => document.removeEventListener('visibilitychange', visibilidad)
	}, [])

	// Videos: solo el activo se reproduce; los demás quedan pausados y al inicio.
	useEffect(() => {
		videos.current.forEach((video, indice) => {
			if (!video) return
			if (indice === actual && esVideoActivo) {
				if (pausado && !sinMovimiento) {
					video.pause()
					return
				}
				if (sinMovimiento) return
				const intento = video.play()
				if (intento?.catch) {
					intento.catch(() => {
						// El navegador no dejó reproducir: se trata como foto (se ve el póster).
						setVideosFallidos((previo) => new Set(previo).add(indice))
					})
				}
			} else {
				video.pause()
				if (video.currentTime > 0) video.currentTime = 0
			}
		})
	}, [actual, esVideoActivo, pausado, sinMovimiento])

	// Reloj del carrusel: fotos por tiempo, videos por su duración. Pinta la barra de progreso.
	useEffect(() => {
		if (!varias) return undefined
		let cuadro = 0
		let anterior = performance.now()
		const avanzar = (ahora) => {
			const delta = ahora - anterior
			anterior = ahora
			let progreso = 0
			if (esVideoActivo) {
				const video = videos.current[actual]
				const duracion = video?.duration && Number.isFinite(video.duration) ? video.duration * 1000 : 0
				if (!pausado) transcurrido.current += delta
				progreso = duracion ? (video.currentTime * 1000) / duracion : 0
				// Red de seguridad: si el video se traba, no se queda para siempre.
				if (!pausado && transcurrido.current > Math.max(duracion + 1500, DURACION_VIDEO_MAX)) {
					ir(actual + 1)
					return
				}
			} else {
				if (!pausado) transcurrido.current += delta
				progreso = transcurrido.current / DURACION_FOTO
				if (progreso >= 1 && !pausado) {
					ir(actual + 1)
					return
				}
			}
			const barra = barras.current[actual]
			if (barra) barra.style.transform = `scaleX(${Math.min(1, Math.max(0, progreso))})`
			cuadro = requestAnimationFrame(avanzar)
		}
		barras.current.forEach((barra, indice) => {
			if (barra && indice !== actual) barra.style.transform = indice < actual ? 'scaleX(1)' : 'scaleX(0)'
		})
		cuadro = requestAnimationFrame(avanzar)
		return () => cancelAnimationFrame(cuadro)
	}, [actual, esVideoActivo, pausado, varias, ir])

	if (!total) return null

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

	// El archivo de video se pide cuando la diapositiva es la activa o la que sigue.
	const siguiente = (actual + 1) % total
	const epigrafe = actualDatos?.epigrafe || ''

	return (
		<div className="hero__medios">
			<div className="hero__pista" aria-hidden="true">
				{diapositivas.map((diapositiva, indice) => {
					const activa = indice === actual
					const primera = indice === 0
					const { imagen } = diapositiva
					const cargarVideo =
						conVideos && diapositiva.tipo === 'video' && diapositiva.video && !videosFallidos.has(indice) && (activa || indice === siguiente)
					return (
						<div
							key={diapositiva.id || indice}
							className={[
								'hero__fondo',
								activa ? 'is-activa' : '',
								diapositiva.tipo === 'imagen' && !sinMovimiento ? 'hero__fondo--zoom' : '',
							]
								.filter(Boolean)
								.join(' ')}
							style={{ '--posicion': imagen?.posicion || '50% 50%' }}
						>
							{imagen?.src && (primera || listo) && (
								<img
									src={imagen.src}
									srcSet={imagen.srcset || undefined}
									sizes="100vw"
									alt=""
									width={imagen.ancho || undefined}
									height={imagen.alto || undefined}
									loading={primera ? 'eager' : 'lazy'}
									fetchPriority={primera ? 'high' : 'low'}
									decoding={primera ? 'sync' : 'async'}
								/>
							)}
							{cargarVideo && (
								<video
									ref={(nodo) => {
										videos.current[indice] = nodo
									}}
									src={diapositiva.video}
									poster={imagen?.src || undefined}
									muted
									playsInline
									preload="auto"
									disablePictureInPicture
									tabIndex={-1}
									onEnded={() => {
										if (indice === actual) ir(actual + 1)
									}}
									onError={() => setVideosFallidos((previo) => new Set(previo).add(indice))}
								/>
							)}
						</div>
					)
				})}
			</div>

			{varias && (
				<div
					className="hero__controles contenedor"
					role="group"
					aria-roledescription="carrusel"
					aria-label="Imágenes de la obra y del taller"
					tabIndex={0}
					onKeyDown={tecla}
					onMouseEnter={() => setPausaHover(true)}
					onMouseLeave={() => setPausaHover(false)}
					onFocus={() => setPausaHover(true)}
					onBlur={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget)) setPausaHover(false)
					}}
				>
					<p className="hero__epigrafe" aria-live="polite">
						<span key={actual} className="hero__epigrafe-texto">
							{epigrafe}
						</span>
					</p>
					<div className="hero__navegacion">
						<button type="button" className="hero__flecha" aria-label="Imagen anterior" onClick={() => ir(actual - 1)}>
							<Chevron sentido="anterior" />
						</button>
						<ol className="hero__indicadores">
							{diapositivas.map((diapositiva, indice) => (
								<li key={diapositiva.id || indice}>
									<button
										type="button"
										className="hero__indicador"
										aria-label={`Ir a la imagen ${indice + 1} de ${total}${diapositiva.tipo === 'video' ? ' (video)' : ''}`}
										aria-current={indice === actual ? 'true' : undefined}
										onClick={() => ir(indice)}
									>
										<span
											className="hero__indicador-barra"
											ref={(nodo) => {
												barras.current[indice] = nodo
											}}
										/>
									</button>
								</li>
							))}
						</ol>
						<button type="button" className="hero__flecha" aria-label="Imagen siguiente" onClick={() => ir(actual + 1)}>
							<Chevron sentido="siguiente" />
						</button>
						{!sinMovimiento && (
							<button
								type="button"
								className="hero__pausa"
								aria-label={pausaManual ? 'Reanudar el carrusel' : 'Pausar el carrusel'}
								aria-pressed={pausaManual}
								onClick={() => setPausaManual((valor) => !valor)}
							>
								<IconoPausa pausado={pausaManual} />
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
