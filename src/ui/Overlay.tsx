import { ITEMS } from '../data/items'
import { AmbienceToggle } from './AmbienceToggle'
import { BackButton } from './BackButton'
import { Brand, Hint } from './Brand'
import { DetailsPanel } from './DetailsPanel'
import { ItemList } from './ItemList'
import { Loader } from './Loader'
import { TiltShift } from './TiltShift'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import './ui.css'

/** En pantallas angostas la lista empieza plegada para no tapar el cuarto (mismo corte que ui.css). */
const isNarrow = () => window.matchMedia('(max-width: 640px)').matches

/** Toda la interfaz HTML sobre el canvas (design D11): accesible y testeable como React normal. */
export function Overlay() {
  useKeyboardShortcuts()
  return (
    <div className="overlay">
      <TiltShift />
      <Brand />
      <ItemList items={ITEMS} defaultOpen={!isNarrow()} closeOnSelect={isNarrow()} />
      <DetailsPanel items={ITEMS}>
        <BackButton />
      </DetailsPanel>
      <div className="bottom-bar">
        <AmbienceToggle />
      </div>
      <Hint />
      <Loader />
    </div>
  )
}
