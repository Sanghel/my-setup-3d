import { useRef } from 'react'
import { Stats } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

/*
 * Solo en desarrollo: FPS (panel de drei) + draw calls y triángulos del último cuadro.
 * La etiqueta es DOM normal fuera del canvas (<DevStatsLabel>); desde dentro del canvas
 * <DevStatsProbe> lee gl.info y escribe el texto directamente, sin re-renderizar React.
 *
 * Con el EffectComposer cada cuadro son varias llamadas a gl.render() (escena + pasadas de bloom,
 * outline…) y three.js reinicia gl.info en cada una: solo se veía la última pasada ("1 draw call").
 * Por eso se desactiva el reinicio automático y se reinicia a mano una vez por cuadro.
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
  // Prioridad 0: corre ANTES del render del composer (prioridad 1), así gl.info tiene el cuadro anterior completo
  useFrame(({ gl }) => {
    window.__gl = gl // para inspeccionar el renderer desde la consola (programas, memoria)
    gl.info.autoReset = false
    // Refrescar el texto cada ~30 cuadros basta
    if (label && ++frame.current % 30 === 0) {
      const { calls, triangles } = gl.info.render
      label.textContent = `draw calls por cuadro: ${calls} · triángulos: ${triangles.toLocaleString('es')}`
    }
    gl.info.reset()
  }, 0)
  return <Stats />
}
