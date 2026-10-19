import { ITEMS } from '../data/items'
import { DetailsPanel } from './DetailsPanel'
import './ui.css'

/** Toda la interfaz HTML sobre el canvas (design D11): accesible y testeable como React normal. */
export function Overlay() {
  return (
    <div className="overlay">
      <DetailsPanel items={ITEMS} />
    </div>
  )
}
