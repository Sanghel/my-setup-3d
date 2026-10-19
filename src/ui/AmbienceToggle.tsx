import type { Ambience } from '../state/sceneStore'
import { useSceneStore } from '../state/sceneStore'

const OPTIONS: { value: Ambience; label: string }[] = [
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
]

/**
 * Selector Tarde / Noche del mock (spec room-ambience: "Cambio de ambiente animado"). Dos botones con
 * aria-pressed dentro de un grupo con nombre: el lector de pantalla anuncia ambas opciones y cuál está
 * activa. La tecla N hace lo mismo (useKeyboardShortcuts).
 */
export function AmbienceToggle() {
  const ambience = useSceneStore((s) => s.ambience)
  const setAmbience = useSceneStore((s) => s.setAmbience)
  return (
    <div className="segmented" role="group" aria-label="Ambiente">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={ambience === option.value}
          onClick={() => setAmbience(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
