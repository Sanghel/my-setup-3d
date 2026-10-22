import { AvatarBubble } from './AvatarBubble'
import { BottomBar } from './BottomBar'
import { Brand, Signature } from './Brand'
import { Hotspots } from './Hotspots'
import { DetailsDrawer } from './DetailsDrawer'
import { Index } from './Index'
import { Loader } from './Loader'
import { TiltShift } from './TiltShift'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import './ui.css'

/** Toda la interfaz HTML sobre el canvas (design D11): accesible y testeable como React normal. */
export function Overlay() {
  useKeyboardShortcuts()
  return (
    <div className="overlay">
      <TiltShift />
      <AvatarBubble />
      <Hotspots />
      <Brand />
      <Index />
      <DetailsDrawer />
      <BottomBar />
      <Signature />
      <Loader />
    </div>
  )
}
