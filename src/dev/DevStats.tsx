import { useRef } from 'react'
import { Stats } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

/*
 * Solo en desarrollo: FPS (panel de drei) + draw calls y triángulos del último cuadro.
 * La etiqueta es DOM normal fuera del canvas (<DevStatsLabel>); desde dentro del canvas
 * <DevStatsProbe> lee gl.info y escribe el texto directamente, sin re-renderizar React.
 */

let label: HTMLDivElement | null = null

export function DevStatsLabel() {
  return (
    <div
      className="dev-stats"
      data-testid="dev-stats"
      ref={(el) => {
        label = el
      }}
    />
  )
}

export function DevStatsProbe() {
  const frame = useRef(0)
  useFrame(({ gl }) => {
    // gl.info lo llena el renderer en cada render(); refrescar cada ~30 cuadros basta
    if (!label || ++frame.current % 30 !== 0) return
    const { calls, triangles } = gl.info.render
    label.textContent = `draw calls: ${calls} · triángulos: ${triangles.toLocaleString('es')}`
  })
  return <Stats />
}
