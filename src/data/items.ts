/**
 * Catálogo de objetos seleccionables: QUÉ es cada cosa y qué se cuenta de ella.
 * `node` es el nombre del nodo en public/models/room.glb (blender/scripts/lib/setup.py).
 * Un nodo del .glb que no esté aquí se dibuja, pero no es interactivo.
 */
export interface ItemDetail {
  label: string
  value: string
}

/**
 * Desde dónde se inspecciona el objeto (grados, convención de camera-controls):
 * azimut 0 = de frente a la pared del fondo (+z); negativo = desde la izquierda (-x).
 * polar 0 = desde arriba; 90 = a la altura del objeto. `azimuthRange` impide ver un objeto
 * de pared desde atrás.
 */
export interface ItemView {
  azimuth: number
  polar: number
  azimuthRange: [number, number]
}

export interface Item {
  id: string
  node: string
  name: string
  description: string
  details?: ItemDetail[]
  view: ItemView
}

export const ITEMS: Item[] = [
  {
    id: 'desk',
    node: 'item_desk',
    name: 'Escritorio',
    description:
      'Escritorio hecho a medida con patas en X y una tira LED blanca bajo el borde que ilumina el piso. Encima, el desk mat "Hello World / ENGINEERS".',
    details: [
      { label: 'Tablero', value: '135 × 75 cm, 71,5 cm de alto' },
      { label: 'Patas', value: 'Tubo de 2 cm en X, cruzadas a 33 cm' },
      { label: 'Desk mat', value: '77 × 29 cm' },
      { label: 'Luz', value: 'Tira LED blanca en los 4 lados, bajo el tablero' },
    ],
    view: { azimuth: -35, polar: 58, azimuthRange: [-75, 15] },
  },
  {
    id: 'ultrawide',
    node: 'item_ultrawide',
    name: 'Monitor ultrawide',
    description: 'Xiaomi Curved Gaming Monitor G34WQi (2026): 34 pulgadas, curvo y con una luz trasera ámbar propia.',
    details: [
      { label: 'Modelo', value: 'Xiaomi G34WQi (2026)' },
      { label: 'Tamaño', value: '34" ultrawide (21:9), 3440 × 1440' },
      { label: 'Curvatura', value: '1500R' },
      { label: 'Medidas', value: '80 × 35 cm' },
    ],
    view: { azimuth: -15, polar: 72, azimuthRange: [-60, 40] },
  },
  {
    id: 'vertical-monitor',
    node: 'item_vertical_monitor',
    name: 'Monitor vertical',
    description:
      'Monitor Gigabyte de 25 pulgadas en vertical, girado 30° hacia el centro y sostenido por un brazo de gas Huanuo. Ideal para código, logs y documentación.',
    details: [
      { label: 'Modelo', value: 'Gigabyte 25"' },
      { label: 'Orientación', value: 'Vertical, girado 30°' },
      { label: 'Brazo', value: 'Huanuo, con abrazadera al tablero' },
    ],
    view: { azimuth: 25, polar: 74, azimuthRange: [-30, 60] },
  },
  {
    id: 'keyboard',
    node: 'item_keyboard',
    name: 'Teclado',
    description: 'Logitech MX Mechanical Mini: mecánico low-profile, compacto y retroiluminado.',
    details: [
      { label: 'Modelo', value: 'Logitech MX Mechanical Mini' },
      { label: 'Formato', value: 'Compacto, 6 filas' },
      { label: 'Medidas', value: '31 × 13 cm' },
    ],
    view: { azimuth: -10, polar: 40, azimuthRange: [-60, 40] },
  },
  {
    id: 'jersey-2008',
    node: 'item_jersey_2008',
    name: 'Camiseta final de Moscú 2008',
    description:
      'Camiseta de manga larga del Manchester United de la final de la UEFA Champions League 2008 en Moscú, con el bordado "Final Moscow 2008 · 21st May · Luzhniki Stadium". United le ganó la final al Chelsea en penales.',
    details: [
      { label: 'Temporada', value: '2007–08 (local)' },
      { label: 'Marca / sponsor', value: 'Nike · AIG' },
      { label: 'Final', value: '21 de mayo de 2008, estadio Luzhniki (Moscú)' },
      { label: 'Marco', value: '67 × 72 cm' },
    ],
    view: { azimuth: -8, polar: 84, azimuthRange: [-50, 45] },
  },
  {
    id: 'jersey-scholes',
    node: 'item_jersey_scholes',
    name: 'Camiseta Scholes 18',
    description:
      'Camiseta de local del Manchester United de la temporada 1998–99, la del triplete (Premier League, FA Cup y Champions League), con el nombre y número de Paul Scholes.',
    details: [
      { label: 'Temporada', value: '1998–99' },
      { label: 'Marca / sponsor', value: 'Umbro · Sharp' },
      { label: 'Jugador', value: 'Paul Scholes, #18' },
      { label: 'Marco', value: '88 × 99 cm' },
    ],
    view: { azimuth: -90, polar: 84, azimuthRange: [-130, -50] },
  },
  {
    id: 'poster',
    node: 'item_poster',
    name: 'Old Trafford',
    description:
      'Vista aérea de Old Trafford, "el Teatro de los Sueños", al atardecer. El panel va separado de la pared con una tira LED roja detrás.',
    details: [
      { label: 'Medidas', value: '44 × 55 cm' },
      { label: 'Luz', value: 'LED rojo en los 4 lados' },
    ],
    view: { azimuth: 0, polar: 84, azimuthRange: [-50, 45] },
  },
]

export const itemById = (id: string) => ITEMS.find((item) => item.id === id)
