// Datos de demostración. Se usan solo cuando no hay proyecto de Sanity configurado.
// Contienen únicamente información confirmada de Celia Gómez Perea: lo que falta
// (año, técnica, medidas, disponibilidad, trayectoria) queda vacío para completarse desde Sanity.

function foto(archivo, ancho, alto, alt = '') {
	const [, nombre, extension] = String(archivo).match(/^(.+)\.([a-z0-9]+)$/i)
	const id = `image-demo-${nombre}-${ancho}x${alto}-${extension.toLowerCase()}`
	return {
		alt,
		asset: {
			_type: 'reference',
			_ref: id,
			_id: id,
			metadata: { dimensions: { width: ancho, height: alto } },
		},
	}
}

function parrafo(partes) {
	return {
		_type: 'block',
		style: 'normal',
		children: partes.map((parte) => ({
			_type: 'span',
			text: parte.texto,
			marks: parte.fuerte ? ['strong'] : [],
		})),
	}
}

const PENDIENTE = 'Título y ficha técnica pendientes de confirmación.'

function obra({
	titulo,
	slug,
	anio = null,
	tecnica = '',
	dimensiones = '',
	estado = 'sin-especificar',
	categoria = '',
	serie = '',
	archivo,
	ancho,
	alto,
	alt,
	destacada = false,
	orden,
	descripcion = '',
	extras = [],
}) {
	return {
		_type: 'obra',
		titulo,
		slug,
		anio,
		tecnica,
		dimensiones,
		estado,
		categoria,
		serie,
		descripcionCorta: descripcion,
		destacadaEnInicio: destacada,
		ordenGaleria: orden,
		imagenPrincipal: foto(archivo, ancho, alto, alt || titulo),
		imagenesAdicionales: extras,
	}
}

// Año, técnica, medidas y categoría quedan sin cargar, y el estado en "sin especificar": no están confirmados.
export const obras = [
	obra({
		titulo: 'Rukacorazon',
		slug: 'rukacorazon',
		archivo: 'celia-rukacorazon.webp',
		ancho: 931,
		alto: 931,
		alt: 'Rukacorazon: trazos dorados que forman una trama sobre un fondo rojo oscuro.',
		orden: 10,
		descripcion: 'Ficha técnica pendiente de confirmación.',
	}),
	obra({
		titulo: 'Allkün / Oír',
		slug: 'allkun-oir',
		archivo: 'celia-allkun.webp',
		ancho: 1080,
		alto: 787,
		alt: 'Allkün / Oír: dibujo de líneas negras sobre fondo claro, con un rostro fragmentado junto a un paisaje.',
		destacada: true,
		orden: 20,
		descripcion: 'Ficha técnica pendiente de confirmación.',
	}),
	obra({
		titulo: 'Obra 01',
		slug: 'obra-01',
		archivo: 'celia-obra-neon.webp',
		ancho: 1080,
		alto: 1350,
		alt: 'Composición fluorescente de trazos violetas, verdes y amarillos sobre un fondo oscuro.',
		destacada: true,
		orden: 30,
		descripcion: PENDIENTE,
	}),
	obra({
		titulo: 'Obra 02',
		slug: 'obra-02',
		archivo: 'celia-obra-color.webp',
		ancho: 1080,
		alto: 1350,
		alt: 'Obra experimental multicolor con trazos amarillos sobre un gran plano azul.',
		destacada: true,
		orden: 40,
		descripcion: PENDIENTE,
	}),
	obra({
		titulo: 'Obra 03',
		slug: 'obra-03',
		archivo: 'celia-obra-lineas.webp',
		ancho: 1080,
		alto: 1080,
		alt: 'Composición de líneas rojas y celestes sobre un fondo oscuro, con el texto «Portal Derecha».',
		destacada: true,
		orden: 50,
		descripcion: PENDIENTE,
	}),
]

const principal = obras.find((item) => item.slug === 'rukacorazon')

const RESUMEN =
	'Celia Gómez Perea —Celi Gómez en redes— es artista visual. Su lenguaje principal es el dibujo en blanco y negro, con tinta y línea, que llega a la escala de la instalación. También trabaja la experimentación gráfica, la obra bidimensional y la producción audiovisual, y desarrolla su obra por proyectos.'

export const artista = {
	_id: 'artista',
	_type: 'artista',
	nombre: 'Celia Gómez Perea',
	subtitulo: 'Artista visual',
	// Frase propia de la artista: se usa tal cual.
	frase: 'Territorio arte',
	bajadaGaleria: 'Dibujo, obra bidimensional y experimentación gráfica.',
	heroInicio: {
		linea1: '',
		linea2: '',
		linea3: '',
		bajada: 'Dibujo en tinta y línea, del papel a la instalación.',
		// Respaldo: cuando llegue 08-bucear-instalacion.jpg, este lugar pasa a la foto de la instalación BUCEAR.
		imagen: foto(
			'celia-proceso.webp',
			1600,
			2123,
			'Registro de proceso: pintura negra vertida con una regadera sobre una superficie blanca.',
		),
	},
	heroAudiovisual: {
		bajada: 'Producción audiovisual de Celia Gómez Perea. Sus piezas se publican en Vimeo.',
		imagen: foto(
			'celia-proceso-cine.webp',
			1600,
			686,
			'Registro de proceso: un hilo de pintura negra cae sobre el piso cubierto de trazos.',
		),
	},
	retrato: foto(
		'celia-taller.webp',
		1066,
		1421,
		'Celia Gómez Perea trabajando con pincel y tinta negra sobre una superficie blanca.',
	),
	fotoTaller: foto(
		'celia-proceso.webp',
		1600,
		2123,
		'Registro de proceso: pintura negra vertida con una regadera sobre una superficie blanca.',
	),
	bioCorta: RESUMEN,
	bioCompleta: [
		parrafo([{ texto: RESUMEN }]),
		parrafo([
			{
				texto: 'Texto de demostración: la biografía completa y la trayectoria confirmada se cargan desde el panel de contenidos.',
			},
		]),
	],
	trayectoria: [],
	exposiciones: [],
	residencias: [],
	publicaciones: [],
	cv: null,
}

// Solo medios de contacto confirmados. Email y WhatsApp se agregan desde Sanity cuando estén disponibles.
export const configuracion = {
	_id: 'configuracion',
	_type: 'configuracion',
	email: '',
	whatsapp: '',
	ciudad: '',
	instagram: 'https://www.instagram.com/celiagomezperea/',
	vimeo: 'https://vimeo.com/celigomez',
	youtube: '',
	envioColeccion: '',
	bajadaGaleria: '',
	obraPrincipal: principal
		? {
				titulo: principal.titulo,
				anio: principal.anio,
				tecnica: principal.tecnica,
				dimensiones: principal.dimensiones,
				estado: principal.estado,
				descripcionCorta: principal.descripcionCorta,
				slug: principal.slug,
				imagenPrincipal: principal.imagenPrincipal,
			}
		: null,
}

// Videos verificados del perfil vimeo.com/celigomez. Pegá aquí los links (por ejemplo https://vimeo.com/123456789).
// Título, portada, duración y descripción se leen de Vimeo durante el build; no se completan a mano.
export const videosVimeo = []
