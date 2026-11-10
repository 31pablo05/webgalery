import { useCallback, useRef, useState } from 'react'
import ModalVimeo from '../audiovisual/ModalVimeo.jsx'

// Botón de reproducir circular del bloque Audiovisual del Inicio: abre el video en el modal de Vimeo.
export default function ReproducirVideo({ video }) {
	const [abierto, setAbierto] = useState(false)
	const boton = useRef(null)
	const cerrar = useCallback(() => {
		setAbierto(false)
		boton.current?.focus()
	}, [])

	if (!video?.vimeoId) return null

	return (
		<>
			<button ref={boton} type="button" className="reproducir" aria-label={`Reproducir ${video.titulo || 'video'}`} onClick={() => setAbierto(true)}>
				<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
					<circle cx="24" cy="24" r="22.5" />
					<path d="M20 16.5 32 24 20 31.5Z" />
				</svg>
			</button>
			<ModalVimeo proyecto={abierto ? video : null} onCerrar={cerrar} />
		</>
	)
}
