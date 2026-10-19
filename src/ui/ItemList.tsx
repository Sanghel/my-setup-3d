import { useState } from 'react'
import type { Item } from '../data/items'
import { useSceneStore } from '../state/sceneStore'

/**
 * Lista de objetos (spec item-inspection: "Lista de objetos accesible"): botones reales, operables con
 * Tab/Enter y lector de pantalla, para enfocar un objeto sin usar el canvas. También permite saltar de un
 * objeto a otro durante la inspección. Plegable (en celular empieza plegada para no tapar el cuarto).
 */
export function ItemList({
  items,
  defaultOpen = true,
  closeOnSelect = false,
}: {
  items: readonly Item[]
  defaultOpen?: boolean
  /** En móvil la lista se pliega al elegir, para no tapar el objeto. */
  closeOnSelect?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const selectedId = useSceneStore((s) => s.selectedId)
  const select = useSceneStore((s) => s.select)

  return (
    <nav className="panel item-list" aria-label="Objetos del cuarto">
      <button
        type="button"
        className="list-toggle"
        aria-expanded={open}
        aria-controls="item-list-items"
        onClick={() => setOpen((value) => !value)}
      >
        Objetos <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <ul id="item-list-items">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-current={item.id === selectedId ? 'true' : undefined}
                onClick={() => {
                  select(item.id)
                  if (closeOnSelect) setOpen(false)
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
