// Proporciones de layout para obras y placeholders.
// Si hay ancho y alto de la imagen (píxeles reales), se usan.
// Si no, se elige una proporción de marco. Nunca se inventan medidas físicas del cuadro.

export const PROPORCIONES = {
	vertical: [4, 5],
	horizontal: [3, 2],
	cuadrada: [1, 1],
}

export function relacionDe({ ancho, alto, proporcion = 'vertical' } = {}) {
	const w = Number(ancho)
	const h = Number(alto)
	if (w > 0 && h > 0) return { ancho: w, alto: h }
	const par = PROPORCIONES[proporcion] || PROPORCIONES.vertical
	return { ancho: par[0], alto: par[1] }
}
