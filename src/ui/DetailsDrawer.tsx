import { useState } from 'react'
import { ITEMS, itemCategory, itemNeighbors, itemNumber, type BuyLink, type Item, type ItemPhoto, type PhotoCredit } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import { BackButton } from './BackButton'

/**
 * Panel de detalle como ficha editorial (spec item-inspection: "Panel de detalles", panel 1 de ajustes
 * visuales 3): se desliza desde la derecha (hoja inferior en celular). Arriba, la primera foto del
 * objeto (o la captura propia de la escena si no tiene fotos) con su número grande y delineado; luego
 * "CATEGORÍA · NN DE 11", el nombre, la descripción, los datos en tarjetas, la compra, las demás fotos
 * y los créditos; abajo, el anterior y el siguiente con su número y su nombre. Los textos vienen del
 * catálogo, nunca de la escena. Siempre está montado para animar la entrada y la salida; cerrado,
 * queda `inert`. Al cerrarse conserva el último objeto para que no se vacíe mientras sale.
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
  const neighbors = item ? itemNeighbors(item.id, items) : null
  const hero = item?.photos?.[0] ?? item?.cover
  const morePhotos = item?.photos?.slice(1) ?? []

  return (
    <aside
      className={`panel drawer${open ? ' drawer--open' : ''}`}
      aria-labelledby="drawer-title"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="drawer__scroll">
        <div className={`drawer__hero${hero ? '' : ' drawer__hero--empty'}`}>
          {hero && (
            <img
              src={hero.src}
              alt={hero.alt}
              // Solo se descarga al abrir el panel de este objeto: no suma a la carga inicial
              loading="lazy"
              decoding="async"
              className={item?.photos?.length ? 'drawer__photo--main' : 'drawer__cover'}
            />
          )}
          <div className="drawer__top">
            <BackButton />
          </div>
          {item && (
            <span className="drawer__number" aria-hidden="true">
              {itemNumber(item.id, items)}
            </span>
          )}
        </div>
        {item && (
          <div className="drawer__body">
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
            {item.buy && item.buy.length > 0 && <BuyLinks links={item.buy} />}
            {morePhotos.length > 0 && (
              <div className="drawer__gallery">
                {morePhotos.map((photo) => (
                  <img key={photo.src} src={photo.src} alt={photo.alt} loading="lazy" decoding="async" className="drawer__photo" />
                ))}
              </div>
            )}
            {item.photos && <PhotoCredits photos={item.photos} />}
          </div>
        )}
      </div>
      {neighbors && (
        <nav className="drawer__nav" aria-label="Recorrer objetos">
          <Neighbor direction="prev" item={neighbors.prev} items={items} onClick={() => step(-1)} />
          <Neighbor direction="next" item={neighbors.next} items={items} onClick={() => step(1)} />
        </nav>
      )}
    </aside>
  )
}

/** "← 07 / Moscú 2008": el vecino con su número y su nombre corto; se anuncia como "Anterior: Moscú 2008". */
function Neighbor({ direction, item, items, onClick }: { direction: 'prev' | 'next'; item: Item; items: readonly Item[]; onClick: () => void }) {
  const number = itemNumber(item.id, items)
  const name = item.short ?? item.name
  const label = direction === 'prev' ? 'Anterior' : 'Siguiente'
  return (
    <button type="button" className={`drawer__neighbor drawer__neighbor--${direction}`} aria-label={`${label}: ${name}`} onClick={onClick}>
      <span className="drawer__neighbor-number" aria-hidden="true">
        {direction === 'prev' ? `← ${number}` : `${number} →`}
      </span>
      <span className="drawer__neighbor-name" aria-hidden="true">
        {name}
      </span>
    </button>
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
