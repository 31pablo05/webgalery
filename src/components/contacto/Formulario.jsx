import { useEffect, useState } from 'react'

function linkWhatsapp(numero) {
	const digitos = String(numero || '').replace(/\D/g, '')
	return digitos ? `https://wa.me/${digitos}` : ''
}

function esEmail(valor) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

// variante "fila": versión compacta del Inicio (nombre y email en una fila, mensaje debajo y el botón al costado).
export default function Formulario({ clave = '', whatsapp = '', variante = '' }) {
	const fila = variante === 'fila'
	const [nombre, setNombre] = useState('')
	const [email, setEmail] = useState('')
	const [mensaje, setMensaje] = useState('')
	const [trampa, setTrampa] = useState('')
	const [errores, setErrores] = useState({})
	const [estado, setEstado] = useState('listo')
	const whatsappHref = linkWhatsapp(whatsapp)

	useEffect(() => {
		const obra = new URLSearchParams(window.location.search).get('obra')
		const limpio = (obra || '').replace(/\s+/g, ' ').trim()
		if (limpio) setMensaje(`Consulta por la obra: ${limpio}`)
	}, [])

	function validar() {
		const siguientes = {}
		if (!nombre.trim()) siguientes.nombre = 'Escribí tu nombre.'
		if (!email.trim()) siguientes.email = 'Escribí tu email.'
		else if (!esEmail(email.trim())) siguientes.email = 'Revisá el email. Tiene que verse como hola@estudio.com.'
		if (!mensaje.trim()) siguientes.mensaje = 'Escribí un mensaje.'
		return siguientes
	}

	async function enviar(event) {
		event.preventDefault()
		const siguientes = validar()
		setErrores(siguientes)
		if (Object.keys(siguientes).length) {
			setEstado('listo')
			return
		}
		if (trampa) {
			setNombre('')
			setEmail('')
			setMensaje('')
			setEstado('ok')
			return
		}
		if (!clave) {
			setEstado('error')
			return
		}
		setEstado('enviando')
		try {
			const respuesta = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					access_key: clave,
					subject: 'Consulta desde el sitio',
					name: nombre.trim(),
					email: email.trim(),
					message: mensaje.trim(),
					botcheck: '',
				}),
			})
			const datos = await respuesta.json().catch(() => ({}))
			if (!respuesta.ok || datos.success === false) {
				setEstado('error')
				return
			}
			setNombre('')
			setEmail('')
			setMensaje('')
			setErrores({})
			setEstado('ok')
		} catch {
			setEstado('error')
		}
	}

	return (
		<form className={fila ? 'formulario formulario--fila' : 'formulario'} onSubmit={enviar} noValidate>
			<div className="contacto-trampa" aria-hidden="true">
				<label>
					No completar
					<input
						type="text"
						name="botcheck"
						tabIndex={-1}
						autoComplete="off"
						value={trampa}
						onChange={(event) => setTrampa(event.target.value)}
					/>
				</label>
			</div>

			<div className="campo">
				<label htmlFor="contacto-nombre">Nombre</label>
				<input
					id="contacto-nombre"
					name="nombre"
					type="text"
					autoComplete="name"
					value={nombre}
					aria-invalid={errores.nombre ? 'true' : undefined}
					aria-describedby={errores.nombre ? 'contacto-nombre-error' : undefined}
					onChange={(event) => setNombre(event.target.value)}
				/>
				{errores.nombre && (
					<p id="contacto-nombre-error" className="campo__error">
						{errores.nombre}
					</p>
				)}
			</div>

			<div className="campo">
				<label htmlFor="contacto-email">Email</label>
				<input
					id="contacto-email"
					name="email"
					type="email"
					autoComplete="email"
					value={email}
					aria-invalid={errores.email ? 'true' : undefined}
					aria-describedby={errores.email ? 'contacto-email-error' : undefined}
					onChange={(event) => setEmail(event.target.value)}
				/>
				{errores.email && (
					<p id="contacto-email-error" className="campo__error">
						{errores.email}
					</p>
				)}
			</div>

			<div className="campo">
				<label htmlFor="contacto-mensaje">Mensaje</label>
				<textarea
					id="contacto-mensaje"
					name="mensaje"
					rows={fila ? 2 : 6}
					value={mensaje}
					aria-invalid={errores.mensaje ? 'true' : undefined}
					aria-describedby={errores.mensaje ? 'contacto-mensaje-error' : undefined}
					onChange={(event) => setMensaje(event.target.value)}
				/>
				{errores.mensaje && (
					<p id="contacto-mensaje-error" className="campo__error">
						{errores.mensaje}
					</p>
				)}
			</div>

			<button
				className={fila ? 'btn btn-relleno formulario__enviar' : 'btn btn-solid btn-block formulario__enviar'}
				type="submit"
				disabled={estado === 'enviando'}
			>
				{estado === 'enviando' ? (
					'Enviando...'
				) : fila ? (
					<>
						Enviar
						<svg className="flecha" viewBox="0 0 22 10" aria-hidden="true" focusable="false">
							<path d="M0 5h20.5M16.5 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</>
				) : (
					<>
						Enviar mensaje <span className="arrow" aria-hidden="true">→</span>
					</>
				)}
			</button>

			{estado === 'ok' && (
				<p className="formulario__aviso" role="status">
					Gracias, te respondo a la brevedad.
				</p>
			)}
			{estado === 'error' && (
				<p className="formulario__aviso" role="alert">
					No se pudo enviar.{' '}
					{whatsappHref ? (
						<a href={whatsappHref} target="_blank" rel="noopener noreferrer">
							Escribime por WhatsApp
						</a>
					) : (
						'Escribime por WhatsApp'
					)}{' '}
					y lo vemos por ahí.
				</p>
			)}
		</form>
	)
}
