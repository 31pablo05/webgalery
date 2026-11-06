// Trazos de tinta dibujados a mano alzada (concepto "Del punto… a la línea").
// Cada recorrido empieza lejos del punto y termina en él, para que la animación avance hacia el punto.

// Hero de escritorio, viewBox 0 0 600 300 (se estira al espacio libre): nace en el borde de la foto,
// a media altura, recorre el blanco y termina arriba a la izquierda, en el punto (10, 16).
export const TRAZO_HERO = {
	viewBox: '0 0 600 300',
	d: 'M600 170 C584 172 571 166 556 160 C534 151 522 168 509 184 C494 203 470 207 452 196 C436 186 441 160 424 151 C401 139 384 171 362 182 C344 191 322 187 311 171 C297 151 309 128 292 117 C270 103 248 132 226 138 C206 143 196 124 181 113 C163 100 149 110 137 120 C121 133 104 128 99 112 C94 96 112 86 116 98 C121 113 98 121 82 108 C64 93 66 64 49 49 C37 38 22 26 10 16',
	punto: { x: 10 / 600, y: 16 / 300 },
}

// Vertical, viewBox 0 0 40 120: baja desde la imagen y termina en el punto (20, 113).
export const TRAZO_VERTICAL = {
	viewBox: '0 0 40 120',
	d: 'M20 0 C16 12 25 22 22 36 C19 49 13 57 17 71 C21 84 26 92 22 102 C21 106 20 109 20 113',
	punto: { cx: 20, cy: 113, r: 2.6 },
}

// Separador estático, más largo y tendido.
export const TRAZO_SEPARADOR = {
	viewBox: '0 0 720 40',
	d: 'M2 21 C46 18 70 13 112 15 C160 17 176 26 224 25 C270 24 290 14 338 15 C384 16 402 26 450 25 C494 24 516 15 560 16 C606 17 628 24 672 23 C690 22 704 20 718 20',
}
