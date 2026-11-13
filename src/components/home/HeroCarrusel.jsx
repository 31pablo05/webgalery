import { useCallback, useEffect, useRef, useState } from 'react'

/*
	Fondo del hero: fotos y videos cortos a pantalla completa, con fundido cruzado.
	El texto NO vive acá: lo renderiza Hero.astro y no cambia con las diapositivas.

	diapositivas: [{ id, tipo: 'imagen' | 'video', video, epigrafe, imagen: { src, srcset, alt, posicion } }]

	- Foto: queda DURACION_FOTO ms con un acercamiento lentísimo.
	- Video: silenciado, sin controles; dura lo que dura el clip y al terminar pasa a la siguiente.
	  Solo se reproduce el video de la diapositiva activa; al salir se pausa y vuelve al inicio.
	  El archivo se pide recién cuando la diapositiva activa o la siguiente es esa (nunca al cargar la página).
	- Sin controles visibles. Se pausa con la pestaña oculta y con un botón que solo aparece con el teclado.
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

export default function HeroCarrusel({ diapositivas = [] }) {
	const total = diapositivas.length
	const [actual, setActual] = useState(0)
	const [pausaManual, setPausaManual] = useState(false)
	const [oculto, setOculto] = useState(false)
	const [videosFallidos, setVideosFallidos] = useState(() => new Set())
	const [listo, setListo] = useState(false)
	const { reducido, ahorro } = usarPreferencias()

	const videos = useRef([])
	const transcurrido = useRef(0)

	const varias = total > 1
	const sinMovimiento = reducido
	const conVideos = listo && !reducido && !ahorro
	const pausado = pausaManual || oculto || sinMovimiento || !varias

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

	// Reloj del carrusel: fotos por tiempo, videos por su duración.
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
			cuadro = requestAnimationFrame(avanzar)
		}
		cuadro = requestAnimationFrame(avanzar)
		return () => cancelAnimationFrame(cuadro)
	}, [actual, esVideoActivo, pausado, varias, ir])

	if (!total) return null

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

			{/*
				Sin controles visibles: el carrusel avanza solo. El epígrafe de la diapositiva queda abajo a la izquierda.
				El botón de pausa es invisible y aparece solo con el teclado (Tab): todo lo que se mueve solo
				más de 5 segundos tiene que poder pausarse (accesibilidad, WCAG 2.2.2).
			*/}
			{varias && (
				<div className="hero__controles contenedor">
					<p className="hero__epigrafe" aria-live="off">
						<span key={actual} className="hero__epigrafe-texto">
							{epigrafe}
						</span>
					</p>
					{!sinMovimiento && (
						<button
							type="button"
							className="hero__pausa-oculta"
							aria-pressed={pausaManual}
							onClick={() => setPausaManual((valor) => !valor)}
						>
							{pausaManual ? 'Reanudar el carrusel de imágenes' : 'Pausar el carrusel de imágenes'}
						</button>
					)}
				</div>
			)}
		</div>
	)
}
