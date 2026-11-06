function escapar(texto) {
	return String(texto)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

export function htmlDePortable(bloques) {
	if (!Array.isArray(bloques)) return ''
	return bloques
		.filter((bloque) => bloque?._type === 'block')
		.map((bloque) => {
			const texto = (bloque.children || [])
				.map((span) => {
					const plano = escapar(span?.text || '')
					if (!plano) return ''
					return (span.marks || []).includes('strong') ? `<strong>${plano}</strong>` : plano
				})
				.join('')
			return texto.trim() ? `<p>${texto}</p>` : ''
		})
		.filter(Boolean)
		.join('')
}

export function textoDePortable(bloques) {
	if (!Array.isArray(bloques)) return ''
	return bloques
		.filter((bloque) => bloque?._type === 'block')
		.map((bloque) => (bloque.children || []).map((span) => span?.text || '').join(''))
		.map((texto) => texto.trim())
		.filter(Boolean)
		.join(' ')
}
