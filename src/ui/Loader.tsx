import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/**
 * Indicador de carga con porcentaje (spec room-scene: "Estado de carga"). useProgress lee el
 * DefaultLoadingManager de three.js, así que funciona fuera del canvas. Se desvanece al terminar.
 */
export function Loader() {
  const { active, progress } = useProgress()
  const done = !active && progress >= 100
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!done) return
    const timeout = setTimeout(() => setHidden(true), 450) // deja terminar el fundido
    return () => clearTimeout(timeout)
  }, [done])

  if (hidden) return null
  const percent = Math.round(progress)
  return (
    <div className={`loader${done ? ' loader--done' : ''}`} role="status" aria-live="polite">
      <div className="loader__card">
        <p className="loader__title">Cargando el cuarto…</p>
        <div className="loader__bar" aria-hidden="true">
          <div className="loader__fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="loader__percent">{percent} %</p>
      </div>
    </div>
  )
}
