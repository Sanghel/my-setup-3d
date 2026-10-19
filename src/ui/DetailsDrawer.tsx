import { useState } from 'react'
import { ITEMS, itemCategory, itemNumber, itemTotal, type Item } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import { BackButton } from './BackButton'

/**
 * Panel de detalle del mock (spec item-inspection: "Panel de detalles"): se desliza desde la derecha
 * (hoja inferior en celular) con el contador, la categoría, el nombre, la descripción, la ficha, una
 * galería opcional y Anterior / Siguiente. Los textos vienen del catálogo, nunca de la escena.
 * Siempre está montado para poder animar la entrada y la salida; cerrado, queda `inert` (fuera del
 * teclado y de los lectores de pantalla). Al cerrarse conserva el último objeto para que no se
 * vacíe mientras sale.
 */
export function DetailsDrawer({ items = ITEMS }: { items?: readonly Item[] }) {
  const selectedId = useSceneStore((s) => s.selectedId)
  const open = useSceneStore((s) => s.mode === 'inspecting')
  const step = useSceneStore((s) => s.step)
  // Último objeto mostrado: al cerrar, el panel lo conserva mientras sale (patrón de React "ajustar el
  // estado durante el render", sin efectos)
  const [shownId, setShownId] = useState<string | null>(null)
  if (open && selectedId && selectedId !== shownId) setShownId(selectedId)
  const item = items.find((i) => i.id === (open ? selectedId : shownId))

  return (
    <aside
      className={`panel drawer${open ? ' drawer--open' : ''}`}
      aria-labelledby="drawer-title"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="drawer__top">
        <BackButton />
        {item && (
          <span className="drawer__counter" aria-label={`Objeto ${itemNumber(item.id, items)} de ${itemTotal(items)}`}>
            {itemNumber(item.id, items)} / {itemTotal(items)}
          </span>
        )}
      </div>
      {item && (
        <div className="drawer__body">
          {item.photos && item.photos.length > 0 && (
            <div className="drawer__gallery">
              {item.photos.map((photo, index) => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  className={index === 0 ? 'drawer__photo drawer__photo--main' : 'drawer__photo'}
                />
              ))}
            </div>
          )}
          <p className="drawer__category">{itemCategory(item, items)}</p>
          <h2 id="drawer-title" className="drawer__title">
            {item.name}
          </h2>
          <p className="drawer__description">{item.description}</p>
          {item.details && item.details.length > 0 && (
            <dl className="drawer__specs">
              {item.details.map((detail) => (
                <div key={detail.label} className="drawer__spec">
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
      <nav className="drawer__nav" aria-label="Recorrer objetos">
        <button type="button" onClick={() => step(-1)}>
          ← Anterior
        </button>
        <button type="button" onClick={() => step(1)}>
          Siguiente →
        </button>
      </nav>
    </aside>
  )
}
