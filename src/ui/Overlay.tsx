import { BottomBar } from './BottomBar'
import { Brand, Signature } from './Brand'
import { Hotspots } from './Hotspots'
import { DetailsDrawer } from './DetailsDrawer'
import { Index } from './Index'
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
      <Hotspots />
      <Brand />
      <Index collapsible={isNarrow()} defaultOpen={!isNarrow()} />
      <DetailsDrawer />
      <BottomBar />
      <Signature />
      <Loader />
    </div>
  )
}
