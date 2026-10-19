import { ITEMS, itemNumber, type Item } from '../data/items'
import { useSceneStore } from '../state/sceneStore'
import { hotspotElements } from './hotspotElements'

/**
 * Puntos de interés numerados del mock (spec item-inspection: "Puntos de interés"). Son botones DOM:
 * accesibles (nombre del objeto, no solo el número) y operables con teclado. La posición la escribe
 * <HotspotProbe> desde el canvas en cada cuadro, sin re-renderizar React.
 */
export function Hotspots({ items = ITEMS }: { items?: readonly Item[] }) {
  const visible = useSceneStore((s) => s.hotspotsVisible && s.mode === 'overview')
  const hoveredId = useSceneStore((s) => s.hoveredId)
  const { hover, select } = useSceneStore.getState()

  return (
    <div className={`hotspots${visible ? '' : ' hotspots--hidden'}`} aria-hidden={!visible}>
      {items.map((item, index) => {
        const active = hoveredId === item.id
        return (
          <div
            key={item.id}
            className={`hotspot${active ? ' hotspot--active' : ''}`}
            ref={(el) => {
              if (el) hotspotElements.set(item.id, el)
              else hotspotElements.delete(item.id)
            }}
          >
            <button
              type="button"
              className="hotspot__button"
              aria-label={item.name}
              tabIndex={visible ? 0 : -1}
              onClick={() => select(item.id)}
              onMouseEnter={() => hover(item.id)}
              onMouseLeave={() => hover(null)}
              onFocus={() => hover(item.id)}
              onBlur={() => hover(null)}
            >
              <span className="hotspot__ring" style={{ animationDelay: `${index * -0.13}s` }} aria-hidden="true" />
              <span className="hotspot__dot" aria-hidden="true">
                {itemNumber(item.id, items)}
              </span>
            </button>
            {active && <span className="hotspot__label">{item.name}</span>}
          </div>
        )
      })}
    </div>
  )
}
