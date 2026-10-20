import { useSceneStore } from '../state/sceneStore'

/** Título del sitio (arriba a la izquierda), como en el mock. */
export function Brand() {
  return (
    <header className="brand">
      <h1 className="brand__title">Mi setup</h1>
      <p className="brand__subtitle">ESCRITORIO · COLECCIÓN UNITED</p>
    </header>
  )
}

/** Corazón pixelado: rejilla de 7×6 celdas (1 = celda pintada), dibujada con bordes nítidos. */
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']

function PixelHeart() {
  return (
    <svg className="signature__icon signature__heart" viewBox="0 0 7 6" role="img" aria-label="love" shapeRendering="crispEdges">
      {HEART.flatMap((row, y) =>
        [...row].map((cell, x) => (cell === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
    </svg>
  )
}

/** Destello de Claude: rayos alrededor de un centro, en el naranja de Claude. */
function ClaudeIcon() {
  const rays = Array.from({ length: 8 }, (_, i) => i * 22.5 + (i % 2) * 90)
  return (
    <svg className="signature__icon" viewBox="-12 -12 24 24" aria-hidden="true">
      {rays.map((angle, i) => (
        <rect key={angle} x="-1.3" y={i % 2 ? -9 : -11} width="2.6" height={i % 2 ? 9 : 11} rx="1.3" fill="#d97757" transform={`rotate(${angle})`} />
      ))}
    </svg>
  )
}

/** three.js: triángulo dividido en triángulos, en línea. */
function ThreeIcon() {
  return (
    <svg className="signature__icon" viewBox="0 0 24 22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M2 20 L12 2 L22 20 Z M7 11 L17 11 L12 20 Z" />
    </svg>
  )
}

/**
 * Firma de los proyectos del autor (abajo al centro, en lugar de la ayuda): "Crafted with ♥ and Claude ·
 * Three.js". three.js es la tecnología que dibuja toda la escena. Se oculta al inspeccionar, como la
 * ayuda que reemplazó (en celular el panel ocupa esa zona).
 */
export function Signature() {
  const inspecting = useSceneStore((s) => s.mode === 'inspecting')
  return (
    <p className={`signature${inspecting ? ' signature--off' : ''}`} aria-hidden={inspecting}>
      Crafted with <PixelHeart /> and{' '}
      <a href="https://claude.com" target="_blank" rel="noopener noreferrer" tabIndex={inspecting ? -1 : undefined}>
        <ClaudeIcon />
        Claude
      </a>
      <span className="signature__dot" aria-hidden="true">
        ·
      </span>
      <a href="https://threejs.org" target="_blank" rel="noopener noreferrer" tabIndex={inspecting ? -1 : undefined}>
        <ThreeIcon />
        Three.js
      </a>
    </p>
  )
}
