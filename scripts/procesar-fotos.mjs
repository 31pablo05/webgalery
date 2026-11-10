// Procesa las fotos originales de public/demo/celia-originales/ (no se publican) a WebP en public/demo/.
// Uso: node scripts/procesar-fotos.mjs
//
// Obras (09, 10, 11): se recortan exactamente al borde de la tela y se corrige la perspectiva solo en
// forma geométrica (homografía de las cuatro esquinas). No se rellena ni se genera nada: cada píxel
// de salida es una interpolación de píxeles reales de la foto.
// Proceso (12, 13, 14): se convierten sin recortar.
// Si un original no está, se saltea y se avisa.

import {existsSync, mkdirSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import sharp from 'sharp'

const ORIGINALES = join(process.cwd(), 'public', 'demo', 'celia-originales')
const SALIDA = join(process.cwd(), 'public', 'demo')
const ANCHOS = [400, 800, 1200]

/*
	esquinas: [arriba-izquierda, arriba-derecha, abajo-derecha, abajo-izquierda] en píxeles del original.
	proporcion: ancho / alto real de la tela. Si no se conocen las medidas, se estima con el promedio
	de los lados opuestos; cuando la artista confirme las medidas, cargarlas acá y volver a correr.
*/
const FOTOS = [
	{
		entrada: '09-cuadro-ventana-azul.jpg',
		salida: 'celia-pintura-09',
		esquinas: [
			[149, 429],
			[747, 450],
			[710, 1031],
			[186, 1109],
		],
		proporcion: null,
	},
	// 10 y 11: falta el original. Al copiarlo, marcar las esquinas de la tela.
	{entrada: '10-*', salida: 'celia-pintura-10', esquinas: null, proporcion: null},
	{entrada: '11-*', salida: 'celia-pintura-11', esquinas: null, proporcion: null},
	{entrada: '12-*', salida: 'celia-proceso-12'},
	{entrada: '13-*', salida: 'celia-proceso-13'},
	{entrada: '14-*', salida: 'celia-proceso-14'},
]

// "10-*" encuentra el primer original cuyo nombre empieza con "10-".
function buscarOriginal(patron) {
	if (!patron.includes('*')) return existsSync(join(ORIGINALES, patron)) ? join(ORIGINALES, patron) : ''
	const prefijo = patron.replace('*', '')
	const archivo = existsSync(ORIGINALES) ? readdirSync(ORIGINALES).find((nombre) => nombre.startsWith(prefijo)) : ''
	return archivo ? join(ORIGINALES, archivo) : ''
}

const distancia = ([ax, ay], [bx, by]) => Math.hypot(bx - ax, by - ay)

// Resuelve A·x = b por eliminación gaussiana con pivoteo parcial.
function resolver(A, b) {
	const n = b.length
	const m = A.map((fila, i) => [...fila, b[i]])
	for (let col = 0; col < n; col++) {
		let pivote = col
		for (let fila = col + 1; fila < n; fila++) if (Math.abs(m[fila][col]) > Math.abs(m[pivote][col])) pivote = fila
		;[m[col], m[pivote]] = [m[pivote], m[col]]
		for (let fila = 0; fila < n; fila++) {
			if (fila === col) continue
			const factor = m[fila][col] / m[col][col]
			for (let k = col; k <= n; k++) m[fila][k] -= factor * m[col][k]
		}
	}
	return m.map((fila, i) => fila[n] / fila[i])
}

// Homografía que lleva cada punto de destino (rectángulo) a su punto en la foto original.
function homografia(destino, origen) {
	const A = []
	const b = []
	destino.forEach(([x, y], i) => {
		const [u, v] = origen[i]
		A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
		b.push(u)
		A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
		b.push(v)
	})
	const [a, bb, c, d, e, f, g, h] = resolver(A, b)
	return (x, y) => {
		const w = g * x + h * y + 1
		return [(a * x + bb * y + c) / w, (d * x + e * y + f) / w]
	}
}

async function enderezar(ruta, esquinas, proporcion) {
	const {data, info} = await sharp(ruta).rotate().removeAlpha().raw().toBuffer({resolveWithObject: true})
	const [tl, tr, br, bl] = esquinas
	const anchoLados = Math.max(distancia(tl, tr), distancia(bl, br))
	const altoLados = Math.max(distancia(tl, bl), distancia(tr, br))
	const relacion = proporcion || (distancia(tl, tr) + distancia(bl, br)) / (distancia(tl, bl) + distancia(tr, br))
	// Nunca más grande que lo que la foto realmente tiene.
	let alto = Math.round(Math.min(altoLados, anchoLados / relacion))
	let ancho = Math.round(alto * relacion)
	const mapa = homografia(
		[
			[0, 0],
			[ancho, 0],
			[ancho, alto],
			[0, alto],
		],
		esquinas,
	)
	const canales = info.channels
	const salida = Buffer.alloc(ancho * alto * canales)
	for (let y = 0; y < alto; y++) {
		for (let x = 0; x < ancho; x++) {
			const [u, v] = mapa(x + 0.5, y + 0.5)
			const x0 = Math.min(info.width - 2, Math.max(0, Math.floor(u - 0.5)))
			const y0 = Math.min(info.height - 2, Math.max(0, Math.floor(v - 0.5)))
			const fx = Math.min(1, Math.max(0, u - 0.5 - x0))
			const fy = Math.min(1, Math.max(0, v - 0.5 - y0))
			for (let k = 0; k < canales; k++) {
				const p = (yy, xx) => data[(yy * info.width + xx) * canales + k]
				const arriba = p(y0, x0) * (1 - fx) + p(y0, x0 + 1) * fx
				const abajo = p(y0 + 1, x0) * (1 - fx) + p(y0 + 1, x0 + 1) * fx
				salida[(y * ancho + x) * canales + k] = Math.round(arriba * (1 - fy) + abajo * fy)
			}
		}
	}
	return sharp(salida, {raw: {width: ancho, height: alto, channels: canales}})
}

async function guardar(imagen, nombre) {
	const buffer = await imagen.webp({quality: 86}).toBuffer()
	const {width, height} = await sharp(buffer).metadata()
	await sharp(buffer).toFile(join(SALIDA, `${nombre}.webp`))
	for (const ancho of ANCHOS) {
		if (ancho >= width) continue
		await sharp(buffer).resize({width: ancho}).webp({quality: 82}).toFile(join(SALIDA, `${nombre}-${ancho}.webp`))
	}
	console.log(`✓ ${nombre}.webp  ${width}×${height}`)
}

mkdirSync(SALIDA, {recursive: true})

for (const foto of FOTOS) {
	const ruta = buscarOriginal(foto.entrada)
	if (!ruta) {
		console.warn(`· Falta el original ${foto.entrada}: se saltea ${foto.salida}.`)
		continue
	}
	if ('esquinas' in foto && !foto.esquinas) {
		console.warn(`· ${foto.entrada}: faltan las esquinas de la tela.`)
		continue
	}
	const imagen = foto.esquinas ? await enderezar(ruta, foto.esquinas, foto.proporcion) : sharp(ruta).rotate()
	await guardar(imagen, foto.salida)
}
