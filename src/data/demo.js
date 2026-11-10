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

function obra({
	titulo,
	slug,
	anio = null,
	tecnica = '',
	dimensiones = '',
	estado = 'sin-especificar',
	categoria = '',
	proyecto = '',
	archivo,
	ancho,
	alto,
	alt,
	destacada = false,
	orden,
	descripcion = '',
	extras = [],
	serie = '',
	ordenEnSerie = null,
	disciplina = '',
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
		proyecto,
		descripcionCorta: descripcion,
		destacadaEnInicio: destacada,
		ordenGaleria: orden,
		// Referencias por slug, como las resuelve la consulta de Sanity (serie->slug, disciplina->slug).
		serie: serie ? { slug: serie } : null,
		ordenEnSerie,
		disciplina: disciplina ? { slug: disciplina } : null,
		imagenPrincipal: foto(archivo, ancho, alto, alt || titulo),
		imagenesAdicionales: extras,
	}
}

// Disciplinas: en Sanity son documentos, así se agrega una cuarta sin tocar código.
export const disciplinas = [
	{ _id: 'disciplina-pinturas', _type: 'disciplina', nombre: 'Pinturas', slug: 'pinturas', descripcion: '', orden: 10, mostrarEnMenu: true },
	{
		_id: 'disciplina-obras-sobre-papel',
		_type: 'disciplina',
		nombre: 'Obras sobre papel',
		slug: 'obras-sobre-papel',
		descripcion: 'Dibujos, registros y piezas de pequeño formato.',
		orden: 20,
		mostrarEnMenu: true,
		// Portada de la sección: el dibujo Allkün. No se le asigna la disciplina porque el soporte no está confirmado.
		portada: foto(
			'celia-allkun.webp',
			1080,
			787,
			'Allkün / Oír: dibujo de líneas negras sobre fondo claro, con un rostro fragmentado junto a un paisaje.',
		),
	},
]

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
		serie: 'serie-de-ejemplo-c',
		ordenEnSerie: 1,
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
		serie: 'serie-de-ejemplo-c',
		ordenEnSerie: 2,
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
		serie: 'serie-de-ejemplo-c',
		ordenEnSerie: 3,
	}),
	// 09, 10 y 11: pinturas sobre tela confirmadas. Título, año, técnica y medidas, pendientes.
	// Fotos recortadas al borde de la tela con scripts/procesar-fotos.mjs.
	obra({
		titulo: 'Obra 04',
		slug: 'obra-04',
		archivo: 'celia-pintura-09.webp',
		ancho: 598,
		alto: 670,
		alt: 'Pintura sobre tela: trazos negros sobre fondo blanco y un plano de veladuras azules a la izquierda.',
		orden: 60,
		disciplina: 'pinturas',
		serie: 'serie-de-ejemplo-b',
		ordenEnSerie: 1,
	}),
	// Las medidas de 10 y 11 se completan al procesar sus fotos (hasta entonces no se muestran).
	obra({
		titulo: 'Obra 05',
		slug: 'obra-05',
		archivo: 'celia-pintura-10.webp',
		ancho: 0,
		alto: 0,
		alt: 'Pintura sobre tela: un gran plano negro atravesado por una franja.',
		orden: 70,
		disciplina: 'pinturas',
		serie: 'serie-de-ejemplo',
		ordenEnSerie: 1,
	}),
	obra({
		titulo: 'Obra 06',
		slug: 'obra-06',
		archivo: 'celia-pintura-11.webp',
		ancho: 0,
		alto: 0,
		alt: 'Pintura sobre tela cruda.',
		orden: 80,
		disciplina: 'pinturas',
		serie: 'serie-de-ejemplo',
		ordenEnSerie: 2,
	}),
]

const imagenDe = (slug) => obras.find((item) => item.slug === slug)?.imagenPrincipal || null
const TEXTO_SERIE_DEMO = 'Serie de demostración. El título y las obras se confirman con la artista.'

// Series de ejemplo: nombres de demostración, nunca nombres que parezcan reales.
// La relación obra–serie se guarda en la obra (obra.serie); la serie no lista sus obras.
export const series = [
	{
		_id: 'serie-de-ejemplo',
		_type: 'serie',
		nombre: 'Serie de ejemplo',
		slug: 'serie-de-ejemplo',
		disciplina: 'pinturas',
		portada: imagenDe('obra-05'),
		descripcion: [parrafo([{ texto: TEXTO_SERIE_DEMO }])],
		anio: '',
		tecnicaGeneral: '',
		orden: 10,
		destacada: true,
		principalInicio: true,
		publicada: true,
	},
	{
		_id: 'serie-de-ejemplo-b',
		_type: 'serie',
		nombre: 'Serie de ejemplo B',
		slug: 'serie-de-ejemplo-b',
		disciplina: 'pinturas',
		portada: imagenDe('obra-04'),
		descripcion: [parrafo([{ texto: TEXTO_SERIE_DEMO }])],
		anio: '',
		tecnicaGeneral: '',
		orden: 20,
		destacada: true,
		principalInicio: false,
		publicada: true,
	},
	{
		_id: 'serie-de-ejemplo-c',
		_type: 'serie',
		nombre: 'Serie de ejemplo C',
		slug: 'serie-de-ejemplo-c',
		disciplina: '',
		portada: imagenDe('obra-02'),
		descripcion: [parrafo([{ texto: TEXTO_SERIE_DEMO }])],
		anio: '',
		tecnicaGeneral: '',
		orden: 30,
		destacada: true,
		principalInicio: false,
		publicada: true,
	},
]

// Diapositivas del hero: textos de demostración de diseño, editables (en Sanity, "Inicio").
// Ninguna foto se repite en el Inicio: la obra 10 queda para la serie destacada.
export const diapositivasHero = [
	{
		_id: 'diapositiva-1',
		_type: 'diapositivaHero',
		etiqueta: '',
		titulo: 'Pintura, cuerpo y territorio',
		subtitulo: 'Exploraciones visuales entre el gesto, la memoria y el espacio.',
		textoBoton: 'Explorar obra',
		enlace: '/obras',
		orden: 10,
		activa: true,
		imagen: {
			...foto(
				'celia-bucear.PNG',
				608,
				340,
				'Celia Gómez Perea dentro de la sala intervenida de BUCEAR: Del punto… a la línea, con paredes y piso cubiertos de trazos de tinta negra.',
			),
			hotspot: { x: 0.37, y: 0.55, width: 1, height: 1 },
		},
	},
	{
		_id: 'diapositiva-2',
		_type: 'diapositivaHero',
		etiqueta: 'Serie destacada',
		titulo: 'Serie de ejemplo',
		subtitulo: '',
		textoBoton: 'Ver serie',
		enlace: '/series/serie-de-ejemplo',
		orden: 20,
		activa: true,
		imagen: imagenDe('obra-06'),
	},
	{
		_id: 'diapositiva-3',
		_type: 'diapositivaHero',
		etiqueta: 'Audiovisual',
		titulo: 'Del punto a la línea, un océano',
		subtitulo: '',
		textoBoton: 'Ver audiovisual',
		enlace: '/audiovisual',
		orden: 30,
		activa: true,
		imagen: foto(
			'celia-proceso-cine.webp',
			1600,
			686,
			'Registro de proceso: un hilo de pintura negra cae sobre el piso cubierto de trazos.',
		),
	},
]

// Proyectos confirmados en publicaciones de la artista. BUCEAR no se asigna a ninguna obra de demo
// porque no está confirmado qué piezas lo integran; se muestra con la foto de la instalación.
export const proyectosArtisticos = [
	{
		nombre: 'BUCEAR: Del punto… a la línea',
		imagen: {
			...foto(
				'celia-bucear.PNG',
				608,
				340,
				'Celia Gómez Perea dentro de la sala intervenida de BUCEAR: Del punto… a la línea, con paredes y piso cubiertos de trazos de tinta negra.',
			),
		},
	},
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
	// Frase introductoria del Inicio: texto de demostración de diseño, editable.
	fraseInicio: 'Obra contemporánea que dialoga con el espacio, el cuerpo y sus huellas.',
	bajadaGaleria: 'Dibujo, obra bidimensional y experimentación gráfica.',
	heroInicio: {
		linea1: '',
		linea2: '',
		linea3: '',
		bajada: 'Dibujo en tinta y línea, del papel a la instalación.',
		// La foto es horizontal y el hero la recorta en vertical: el punto de interés queda sobre la artista.
		imagen: {
			...foto(
				'celia-bucear.PNG',
				608,
				340,
				'Celia Gómez Perea dentro de la sala intervenida de BUCEAR: Del punto… a la línea, con paredes y piso cubiertos de trazos de tinta negra.',
			),
			hotspot: { x: 0.37, y: 0.55, width: 1, height: 1 },
		},
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
	retrato: {
		...foto(
			'celia-taller.webp',
			1066,
			1421,
			'Celia Gómez Perea trabajando con pincel y tinta negra sobre una superficie blanca.',
		),
		hotspot: { x: 0.5, y: 0.42, width: 1, height: 1 },
	},
	// También es la imagen del bloque Audiovisual del Inicio mientras no haya videos cargados.
	fotoTaller: {
		...foto(
			'celia-proceso.webp',
			1600,
			2123,
			'Registro de proceso: pintura negra vertida con una regadera sobre una superficie blanca.',
		),
		hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
	},
	// Bio corta de docs/contenido-sobre-la-artista.md, tal cual.
	bioCorta:
		'Celia Gómez Perea es artista visual y docente de Chubut. Trabaja e investiga el territorio de forma interdisciplinar, entre la pintura, el dibujo, la instalación, la performance y el video.',
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
