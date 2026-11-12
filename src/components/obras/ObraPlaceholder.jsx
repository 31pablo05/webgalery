import { relacionDe } from '../../lib/proporcion.js'

// Misma pieza que ObraPlaceholder.astro, para los islands que arman la imagen en el cliente
// (galería, visor, hero y audiovisuales) y tienen que reemplazarla si la URL falla.
export default function ObraPlaceholder({
	proporcion = 'vertical',
	ancho,
	alto,
	titulo = '',
	llenar = false,
	pie = false,
	className = '',
}) {
	const relacion = relacionDe({ ancho, alto, proporcion })
	const nombre = String(titulo || '').trim()
	const etiqueta = nombre ? `Imagen pendiente. ${nombre}` : 'Imagen pendiente'
	const clases = ['obra-pendiente', llenar && 'obra-pendiente--llena', pie && 'obra-pendiente--pie', className]
		.filter(Boolean)
		.join(' ')

	return (
		<div
			className={clases}
			style={llenar ? undefined : { aspectRatio: `${relacion.ancho} / ${relacion.alto}` }}
			role="img"
			aria-label={etiqueta}
		>
			<div className="obra-pendiente__marco">
				<p className="obra-pendiente__estado">Imagen pendiente</p>
				{nombre ? <p className="obra-pendiente__titulo">{nombre}</p> : null}
			</div>
		</div>
	)
}
