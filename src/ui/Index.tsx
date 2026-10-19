import { useState } from 'react'
import { groupedItems, ITEMS, itemNumber, type Item } from '../data/items'
import { useSceneStore } from '../state/sceneStore'

/**
 * Índice del mock (spec item-inspection: "Lista de objetos accesible"): objetos agrupados por categoría
 * con su número, botones reales (Tab / Enter / lector de pantalla) y el botón para ocultar los puntos.
 * El hover se sincroniza con los puntos de la escena. En celular se pliega (`collapsible`).
 * A diferencia del mock, sigue visible al inspeccionar: la spec pide saltar a otro objeto desde aquí.
 */
export function Index({
  items = ITEMS,
  collapsible = false,
  defaultOpen = true,
}: {
  items?: readonly Item[]
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const selectedId = useSceneStore((s) => s.selectedId)
  const hoveredId = useSceneStore((s) => s.hoveredId)
  const hotspotsVisible = useSceneStore((s) => s.hotspotsVisible)
  const { select, hover, toggleHotspots } = useSceneStore.getState()
  const expanded = !collapsible || open

  return (
    <nav className="panel index" aria-label="Índice de objetos">
      <div className="index__header">
        {collapsible ? (
          <button
            type="button"
            className="index__title index__toggle"
            aria-expanded={open}
            aria-controls="index-groups"
            onClick={() => setOpen((value) => !value)}
          >
            ÍNDICE <span aria-hidden="true">{open ? '▾' : '▸'}</span>
          </button>
        ) : (
          <h2 className="index__title">ÍNDICE</h2>
        )}
        <button type="button" className="chip" aria-pressed={!hotspotsVisible} onClick={toggleHotspots}>
          {hotspotsVisible ? 'Ocultar puntos' : 'Mostrar puntos'} <kbd>H</kbd>
        </button>
      </div>
      {expanded && (
        <div id="index-groups">
          {groupedItems(items).map((group) => (
            <section key={group.id} aria-labelledby={`index-${group.id}`}>
              <h3 id={`index-${group.id}`} className="index__group">
                {group.title}
              </h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`index__item${hoveredId === item.id ? ' index__item--hover' : ''}`}
                      aria-current={item.id === selectedId ? 'true' : undefined}
                      onClick={() => {
                        select(item.id)
                        if (collapsible) setOpen(false)
                      }}
                      onMouseEnter={() => hover(item.id)}
                      onMouseLeave={() => hover(null)}
                    >
                      <span className="index__number" aria-hidden="true">
                        {itemNumber(item.id, items)}
                      </span>
                      {item.short ?? item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </nav>
  )
}
