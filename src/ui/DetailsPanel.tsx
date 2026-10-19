import type { Item } from '../data/items'
import { useSceneStore } from '../state/sceneStore'

/**
 * Panel con la información del objeto inspeccionado (spec item-inspection: "Panel de detalles").
 * Los textos salen del catálogo (src/data/items.ts), nunca de la escena.
 */
export function DetailsPanel({ items, children }: { items: readonly Item[]; children?: React.ReactNode }) {
  const selectedId = useSceneStore((s) => s.selectedId)
  const mode = useSceneStore((s) => s.mode)
  const item = mode === 'inspecting' ? items.find((i) => i.id === selectedId) : undefined
  if (!item) return null

  return (
    <aside className="panel details" aria-labelledby="details-title">
      {children}
      <h2 id="details-title" tabIndex={-1}>
        {item.name}
      </h2>
      <p className="details__description">{item.description}</p>
      {item.details && item.details.length > 0 && (
        <dl className="details__list">
          {item.details.map((detail) => (
            <div key={detail.label} className="details__row">
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  )
}
