import { groupedItems, ITEMS, itemNumber, type Item } from '../data/items'
import { useSceneStore } from '../state/sceneStore'

/**
 * Índice como riel numerado (spec item-inspection: "Lista de objetos accesible", menú B de ajustes
 * visuales 3): una columna de círculos con el número de cada objeto, agrupados por categoría. El
 * círculo se despliega en una pastilla con el nombre al pasar el puntero, con el foco del teclado,
 * cuando el objeto está en hover desde la escena o mientras se inspecciona (todo en CSS). Son botones
 * reales con el número y el nombre como etiqueta. Sigue visible al inspeccionar para saltar a otro objeto.
 */
export function Index({ items = ITEMS }: { items?: readonly Item[] }) {
  const selectedId = useSceneStore((s) => s.selectedId)
  const hoveredId = useSceneStore((s) => s.hoveredId)
  const { select, hover } = useSceneStore.getState()

  return (
    <nav className="index" aria-label="Índice de objetos">
      {groupedItems(items).map((group) => (
        <section key={group.id} className={`index__section index__section--${group.id}`} aria-labelledby={`index-${group.id}`}>
          <h2 id={`index-${group.id}`} className="index__group">
            {group.title}
          </h2>
          <ul>
            {group.items.map((item) => {
              const number = itemNumber(item.id, items)
              const name = item.short ?? item.name
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`index__item${hoveredId === item.id ? ' index__item--hover' : ''}`}
                    aria-label={`${number} ${name}`}
                    aria-current={item.id === selectedId ? 'true' : undefined}
                    onClick={() => select(item.id)}
                    onMouseEnter={() => hover(item.id)}
                    onMouseLeave={() => hover(null)}
                    onFocus={() => hover(item.id)}
                    onBlur={() => hover(null)}
                  >
                    <span className="index__number" aria-hidden="true">
                      {number}
                    </span>
                    <span className="index__name" aria-hidden="true">
                      {name}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}
