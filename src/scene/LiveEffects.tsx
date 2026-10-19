import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Box3, CanvasTexture, SRGBColorSpace, Vector3, type Mesh, type Points } from 'three'
import { useReducedMotion } from '../ui/useReducedMotion'
import { ambienceUniforms } from './ambience'
import { useCatalogRegistry } from './catalogRegistry'
import { breath, dustOpacity, ledGlowOpacity, seedDust, stepDust, type DustBox } from './liveEffectsMath'

/** Efectos vivos sobre la luz horneada (redesign D3): el lightmap es estático; esto se mueve encima. */
export function LiveEffects() {
  return (
    <>
      <PosterGlow />
      <Dust />
    </>
  )
}

/** Gradiente radial en un canvas: el halo del LED (como el `radial()` del mock). */
function radialTexture(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const g = canvas.getContext('2d')!
  const gradient = g.createRadialGradient(128, 128, 6, 128, 128, 128)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gradient
  g.fillRect(0, 0, 256, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * Halo del LED rojo detrás del poster: un plano aditivo pegado a la pared, detrás del panel (el poster
 * tapa el centro y el halo asoma alrededor). Su opacidad "respira" de noche. El halo horneado queda
 * como base fija; este suma la variación.
 */
function PosterGlow() {
  const poster = useCatalogRegistry((s) => s.roots.get('poster'))
  const reducedMotion = useReducedMotion()
  const mesh = useRef<Mesh>(null)
  const texture = useMemo(() => radialTexture('rgba(255,70,90,1)') /* rosado del mock: sobre una pared ya roja, el rojo puro no se nota */, [])
  const placement = useMemo(() => {
    if (!poster) return null
    const box = new Box3().setFromObject(poster)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    // La pared del fondo está en z = 0; el plano 3 mm delante de ella, por detrás del panel
    return { position: [center.x, center.y, 0.003] as const, scale: [size.x * 2.2, size.y * 1.9, 1] as const }
  }, [poster])

  useFrame(({ clock }) => {
    const material = mesh.current?.material as { opacity: number } | undefined
    if (!material) return
    material.opacity = ledGlowOpacity(ambienceUniforms.uAmbience.value, breath(clock.elapsedTime, reducedMotion))
  })

  if (!placement) return null
  return (
    <mesh ref={mesh} position={placement.position} scale={placement.scale} renderOrder={1}>
      <planeGeometry />
      {/* Color ×3 (HDR): la pared junto al poster ya está muy iluminada por el halo horneado y AgX
          comprime las luces altas; con color 1 la respiración apenas cambiaba un nivel de 255. */}
      <meshBasicMaterial
        map={texture}
        color={[GLOW_GAIN, GLOW_GAIN, GLOW_GAIN]}
        transparent
        opacity={0}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

const GLOW_GAIN = 3

/** Volumen del haz de sol (metros): de la ventana hacia el piso, donde cae la mancha. */
const SUN_BEAM: DustBox = { min: [0.35, 0.1, 0.45], max: [1.68, 2.1, 1.75] }
const DUST_COUNT = 260

/** Polvo flotando a contraluz: solo de tarde; quieto con movimiento reducido. */
function Dust() {
  const reducedMotion = useReducedMotion()
  const points = useRef<Points>(null)
  const positions = useMemo(() => seedDust(DUST_COUNT, SUN_BEAM), [])

  useFrame(({ clock }, delta) => {
    const object = points.current
    if (!object) return
    const opacity = dustOpacity(ambienceUniforms.uAmbience.value)
    ;(object.material as { opacity: number }).opacity = opacity
    object.visible = opacity > 0.01
    if (!object.visible || reducedMotion) return
    stepDust(positions, SUN_BEAM, clock.elapsedTime, Math.min(delta, 0.1))
    object.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffd9a8" size={0.008} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
    </points>
  )
}
