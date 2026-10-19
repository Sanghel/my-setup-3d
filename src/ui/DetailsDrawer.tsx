import { useState } from 'react'
import { ITEMS, itemCategory, itemNumber, itemTotal, type BuyLink, type Item, type ItemPhoto, type PhotoCredit } from '../data/items'
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
                  // Solo se descargan al abrir el panel de este objeto: no suman a la carga inicial
                  loading="lazy"
                  decoding="async"
                  className={index === 0 ? 'drawer__photo drawer__photo--main' : 'drawer__photo'}
                />
              ))}
            </div>
          )}
          {item.photos && <PhotoCredits photos={item.photos} />}
          <p className="drawer__category">{itemCategory(item, items)}</p>
          <h2 id="drawer-title" className="drawer__title">
            {item.name}
          </h2>
          <p className="drawer__description">{item.description}</p>
          {item.buy && item.buy.length > 0 && <BuyLinks links={item.buy} />}
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

/** "Fotos: JBL · PlayStation": una vez cada fuente (por nombre), con enlace a su página. */
function PhotoCredits({ photos }: { photos: ItemPhoto[] }) {
  const credits = new Map<string, PhotoCredit>()
  for (const { credit } of photos) if (credit && !credits.has(credit.label)) credits.set(credit.label, credit)
  if (credits.size === 0) return null
  return (
    <p className="drawer__credit">
      Fotos:{' '}
      {[...credits.values()].map((credit, index) => (
        <span key={credit.label}>
          {index > 0 && ' · '}
          <a href={credit.url} target="_blank" rel="noopener noreferrer">
            {credit.label}
            <span className="visually-hidden"> (se abre en una pestaña nueva)</span>
          </a>
        </span>
      ))}
    </p>
  )
}

/** "Ver en Amazon" (o "Ver mouse en Amazon" si el objeto tiene varios productos): pestaña nueva, sin afiliado. */
function BuyLinks({ links }: { links: BuyLink[] }) {
  return (
    <div className="drawer__buy">
      {links.map((link) => (
        <a
          key={link.url}
          className="drawer__buy-link"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver ${link.product} en ${link.store} (se abre en una pestaña nueva)`}
        >
          {links.length > 1 && link.short ? `Ver ${link.short} en ${link.store}` : `Ver en ${link.store}`}
          <span aria-hidden="true"> ↗</span>
        </a>
      ))}
    </div>
  )
}
