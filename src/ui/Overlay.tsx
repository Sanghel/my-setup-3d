import { ITEMS } from '../data/items'
import { BackButton } from './BackButton'
import { DetailsPanel } from './DetailsPanel'
import { ItemList } from './ItemList'
import { Loader } from './Loader'
import './ui.css'

/** Toda la interfaz HTML sobre el canvas (design D11): accesible y testeable como React normal. */
export function Overlay() {
  return (
    <div className="overlay">
      <ItemList items={ITEMS} />
      <DetailsPanel items={ITEMS}>
        <BackButton />
      </DetailsPanel>
      <Loader />
    </div>
  )
}
