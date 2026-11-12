import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Reproductor de Vimeo en un modal. El iframe se crea recién al abrir: la página carga sin iframes.
// proyecto: { titulo, vimeoId, vimeoHash }. onCerrar: lo llama al cerrar (botón, clic afuera o Escape).

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

function IconoCerrar() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.25" />
		</svg>
	)
}

export default function ModalVimeo({ proyecto, onCerrar }) {
	const cerrarBtn = useRef(null)
	// Referencia estable: el efecto corre solo al abrir o cambiar de video, no en cada render del padre.
	const alCerrar = useRef(onCerrar)
	alCerrar.current = onCerrar

	useEffect(() => {
		if (!proyecto) return undefined
		const overflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		cerrarBtn.current?.focus()

		function tecla(event) {
			if (event.key !== 'Escape') return
			event.preventDefault()
			alCerrar.current()
		}

		window.addEventListener('keydown', tecla)
		return () => {
			document.body.style.overflow = overflow
			window.removeEventListener('keydown', tecla)
		}
	}, [proyecto])

	if (!proyecto) return null

	return createPortal(
		<div className="av-modal" role="dialog" aria-modal="true" aria-label={proyecto.titulo || 'Video'} onClick={onCerrar}>
			<button
				ref={cerrarBtn}
				type="button"
				className="lightbox__btn lightbox__cerrar"
				aria-label="Cerrar"
				onClick={(event) => {
					event.stopPropagation()
					onCerrar()
				}}
			>
				<IconoCerrar />
			</button>
			<div
				className={proyecto.alto > proyecto.ancho && proyecto.ancho > 0 ? 'av-modal__marco av-modal__marco--vertical' : 'av-modal__marco'}
				onClick={(event) => event.stopPropagation()}
			>
				<iframe
					src={embed(proyecto)}
					title={proyecto.titulo || 'Video'}
					allow="autoplay; fullscreen; picture-in-picture"
					allowFullScreen
				/>
			</div>
		</div>,
		document.body,
	)
}
