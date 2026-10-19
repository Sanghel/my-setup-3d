import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { useSceneStore } from '../state/sceneStore'
import { AMBIENCE_EXPOSURE, AMBIENCE_VALUE, ambienceUniforms } from './ambience'

/** Qué tan rápido se cruza de un ambiente al otro: con λ = 3, ~95 % del camino en un segundo. */
const LAMBDA = 3

/**
 * Anima el cambio Tarde ⇄ Noche: un solo número (`uAmbience`, compartido por todos los shaders) y
 * la exposición del tone mapping, que también viene de cada horneado. La cámara no se toca.
 */
export function AmbienceDriver() {
  useFrame(({ gl }, delta) => {
    const target = AMBIENCE_VALUE[useSceneStore.getState().ambience]
    const uniform = ambienceUniforms.uAmbience
    if (Math.abs(uniform.value - target) > 0.0005) uniform.value = MathUtils.damp(uniform.value, target, LAMBDA, delta)
    else uniform.value = target
    const steps = MathUtils.lerp(AMBIENCE_EXPOSURE.tarde, AMBIENCE_EXPOSURE.noche, uniform.value)
    gl.toneMappingExposure = 2 ** steps
  })
  return null
}
