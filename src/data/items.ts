import productPhotos from './productPhotos.json' with { type: 'json' }

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

/** Categorías del índice, en el orden en que se muestran (como en el mock de Claude Design). */
export const GROUPS = [
  { id: 'setup', title: 'SETUP' },
  { id: 'coleccion', title: 'COLECCIÓN' },
  { id: 'detalles', title: 'DETALLES' },
] as const

export type GroupId = (typeof GROUPS)[number]['id']

/** De dónde viene una foto: se muestra como "Fotos: <label>" con enlace a `url`. */
export interface PhotoCredit {
  label: string
  url: string
}

/** Foto del objeto para la galería del panel. Nunca fotos con pantallas de trabajo. */
export interface ItemPhoto {
  src: string
  alt: string
  /** Fuente de la foto (las oficiales del fabricante siempre la llevan). */
  credit?: PhotoCredit
}

/**
 * Enlace de compra (match-mock-content D7): normal, sin afiliado, confirmado por el usuario.
 * `short` nombra el producto en el botón cuando el objeto tiene más de uno ("Ver mouse en Amazon").
 */
export interface BuyLink {
  product: string
  short?: string
  store: string
  url: string
}

export interface Item {
  id: string
  node: string
  name: string
  /** Nombre corto para el índice (por defecto, `name`). */
  short?: string
  group: GroupId
  description: string
  details?: ItemDetail[]
  view: ItemView
  /** Ajuste (metros) del punto de interés respecto al centro superior de la caja del objeto. */
  anchorOffset?: [number, number, number]
  /**
   * Galería del panel. Los productos comerciales toman las fotos oficiales de productPhotos.json
   * (npm run products:photos); los personalizados quedan sin fotos hasta que el usuario tome las suyas.
   */
  photos?: ItemPhoto[]
  /** Dónde comprarlo. Sin enlace confirmado, no hay botón. */
  buy?: BuyLink[]
}

const CATALOG: Item[] = [
  {
    id: 'desk',
    group: 'setup',
    node: 'item_desk',
    name: 'Escritorio',
    description:
      'Escritorio hecho a medida con patas en X y una tira LED blanca bajo el borde que ilumina el piso. Encima, el desk mat "Hello World / ENGINEERS".',
    details: [
      { label: 'Tablero', value: '150 × 75 cm, 71,5 cm de alto' },
      { label: 'Patas', value: 'Tubo de 2 cm en X, cruzadas a 33 cm' },
      { label: 'Desk mat', value: '77 × 29 cm' },
      { label: 'Luz', value: 'Tira LED blanca en los 4 lados, bajo el tablero' },
    ],
    view: { azimuth: -35, polar: 58, azimuthRange: [-75, 15] },
    // El centro del tablero cae sobre el teclado: el punto va a la esquina delantera izquierda (como el mock)
    anchorOffset: [-0.5, 0, 0.25],
  },
  {
    id: 'ultrawide',
    group: 'setup',
    short: 'Ultrawide',
    node: 'item_ultrawide',
    name: 'Monitor ultrawide',
    description: 'Xiaomi Curved Gaming Monitor G34WQi (2026): 34 pulgadas, curvo y con una luz trasera ámbar propia.',
    details: [
      { label: 'Modelo', value: 'Xiaomi G34WQi (2026)' },
      { label: 'Tamaño', value: '34" ultrawide (21:9), 3440 × 1440' },
      { label: 'Curvatura', value: '1500R' },
      { label: 'Medidas', value: '80 × 35 cm' },
    ],
    buy: [{ product: 'Xiaomi G34WQi', store: 'Amazon', url: 'https://www.amazon.com/dp/B0D1HQK5G5' }],
    view: { azimuth: -15, polar: 72, azimuthRange: [-60, 40] },
  },
  {
    id: 'vertical-monitor',
    group: 'setup',
    short: 'Vertical',
    node: 'item_vertical_monitor',
    name: 'Monitor vertical',
    description:
      'Gigabyte GS27FA de 27 pulgadas en vertical, girado 30° hacia el centro y sostenido por un brazo de gas Huanuo. Ideal para código, logs y documentación.',
    details: [
      { label: 'Modelo', value: 'Gigabyte GS27FA' },
      { label: 'Panel', value: '27" IPS, Full HD, 180 Hz' },
      { label: 'Orientación', value: 'Vertical, girado 30°' },
      { label: 'Brazo', value: 'Huanuo, con abrazadera al tablero' },
    ],
    buy: [{ product: 'Gigabyte GS27FA', store: 'Amazon', url: 'https://www.amazon.com/dp/B0DTYX5QP8' }],
    view: { azimuth: 25, polar: 74, azimuthRange: [-30, 60] },
  },
  {
    id: 'keyboard',
    group: 'setup',
    short: 'Teclado',
    node: 'item_keyboard',
    name: 'Teclado y mouse',
    description:
      'Logitech MX Mechanical Mini: mecánico low-profile, compacto y con retroiluminación, junto al mouse sobre el desk mat "Engineers".',
    details: [
      { label: 'Teclado', value: 'Logitech MX Mechanical Mini' },
      { label: 'Switches', value: 'Lineales (rojos)' },
      { label: 'Mouse', value: 'Logitech MX Master 3S' },
      { label: 'Formato', value: 'Compacto, 6 filas' },
      { label: 'Medidas', value: '31 × 13 cm' },
      { label: 'Desk mat', value: 'Engineers, negro' },
    ],
    buy: [
      { product: 'Logitech MX Mechanical Mini (Linear)', short: 'teclado', store: 'Amazon', url: 'https://www.amazon.com/dp/B09LJWXD6M' },
      { product: 'Logitech MX Master 3S', short: 'mouse', store: 'Amazon', url: 'https://www.amazon.com/dp/B09HM94VDS' },
    ],
    view: { azimuth: -10, polar: 40, azimuthRange: [-60, 40] },
  },
  {
    id: 'chair',
    group: 'setup',
    node: 'item_chair',
    name: 'Silla',
    description: 'Silla ergonómica de malla negra con cabecero y apoyabrazos ajustables, frente al escritorio.',
    details: [
      { label: 'Material', value: 'Malla negra' },
      { label: 'Extras', value: 'Cabecero y apoyabrazos ajustables' },
    ],
    buy: [
      {
        product: 'Silla ergonómica Signature (modelo de referencia)',
        store: 'Mublex',
        url: 'https://www.mublex.com/sillas/sillas-de-escritorio-y-oficina/sillas-ergonomicas/sillas-con-ergonomia-avanzada/silla-ergonomica-signature-con-soporte-lumbar-ajustable',
      },
    ],
    view: { azimuth: -35, polar: 70, azimuthRange: [-90, 20] },
  },
  {
    id: 'laptops',
    group: 'setup',
    short: 'Portátiles',
    node: 'item_laptops',
    name: 'Portátiles en el dock',
    description:
      'MacBook Pro 14" M4 en negro espacial y ASUS TUF Gaming 15" llena de stickers, paradas en un dock vertical doble a la derecha del ultrawide.',
    details: [
      { label: 'Adelante', value: 'MacBook Pro 14" M4, negro espacial' },
      { label: 'Atrás', value: 'ASUS TUF Gaming 15", con stickers' },
      { label: 'Dock', value: 'Soporte vertical doble, negro' },
    ],
    view: { azimuth: 22, polar: 80, azimuthRange: [-30, 55] },
    // Asoman a la derecha del ultrawide: el punto va sobre la parte que se ve, no detrás de la pantalla
    anchorOffset: [0.1, -0.04, 0.02],
  },
  {
    id: 'jersey-2008',
    group: 'coleccion',
    short: 'Moscú 2008',
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
    group: 'coleccion',
    short: 'Scholes 18',
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
    group: 'coleccion',
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
  {
    id: 'pegboard',
    group: 'detalles',
    short: 'Organizador',
    node: 'item_pegboard',
    name: 'Organizador de pared',
    description:
      'Pegboard negro en la esquina con vasos, un parlante JBL naranja, el control de PS5 rojo, llaveros, un mini balón del United y un cactus.',
    details: [
      { label: 'Incluye', value: 'Parlante JBL Clip 4 · control DualSense · mini balón' },
      { label: 'Medidas', value: '28 × 62 cm (aprox.)' },
    ],
    buy: [
      { product: 'JBL Clip 4 naranja', short: 'JBL', store: 'Amazon', url: 'https://www.amazon.com/dp/B08PJDYNPL' },
      { product: 'DualSense Cosmic Red', short: 'DualSense', store: 'Amazon', url: 'https://www.amazon.com/dp/B094WN6SY2' },
    ],
    view: { azimuth: -90, polar: 82, azimuthRange: [-130, -50] },
  },
  {
    id: 'funko',
    group: 'detalles',
    short: 'Funko Madara',
    node: 'item_funko',
    name: 'Funko de Madara',
    description: 'Figura Funko Pop! de Madara Uchiha en modo Seis Caminos, parada frente a la base del ultrawide.',
    details: [
      { label: 'Serie', value: 'Naruto Shippuden' },
      { label: 'Ubicación', value: 'Frente al monitor' },
    ],
    buy: [{ product: 'Funko Pop! Madara Uchiha (Six Paths) #1196', store: 'Amazon', url: 'https://www.amazon.com/dp/B09V9P3WHM' }],
    view: { azimuth: -20, polar: 72, azimuthRange: [-70, 30] },
  },
]

/** El catálogo con las fotos oficiales de cada producto (match-mock-content D6). */
export const ITEMS: Item[] = CATALOG.map((item) => {
  const photos = (productPhotos as Record<string, ItemPhoto[]>)[item.id]
  return photos ? { ...item, photos } : item
})

export const itemById = (id: string) => ITEMS.find((item) => item.id === id)

/** Número de dos dígitos del objeto según su orden en el catálogo ("01", "02"…); "" si no existe. */
export function itemNumber(id: string, items: readonly Item[] = ITEMS): string {
  const index = items.findIndex((item) => item.id === id)
  return index < 0 ? '' : String(index + 1).padStart(2, '0')
}

/** Total de objetos con el mismo formato, para el contador "03 / 07". */
export const itemTotal = (items: readonly Item[] = ITEMS) => String(items.length).padStart(2, '0')

/** Etiqueta de categoría del panel: "SETUP · 03". */
export function itemCategory(item: Item, items: readonly Item[] = ITEMS): string {
  const group = GROUPS.find((g) => g.id === item.group)
  return `${group?.title ?? ''} · ${itemNumber(item.id, items)}`
}

/** El índice: grupos en orden, cada uno con sus objetos; los grupos sin objetos no aparecen. */
export function groupedItems(items: readonly Item[] = ITEMS) {
  return GROUPS.map((group) => ({ ...group, items: items.filter((item) => item.group === group.id) })).filter(
    (group) => group.items.length > 0,
  )
}
