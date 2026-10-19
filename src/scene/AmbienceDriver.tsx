import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { useSceneStore } from '../state/sceneStore'
import { AMBIENCE_EXPOSURE, AMBIENCE_VALUE, ambienceUniforms, intro } from './ambience'
import { introExposure } from './cameraTween'

/** Qué tan rápido se cruza de un ambiente al otro: con λ = 3, ~95 % del camino en un segundo. */
const LAMBDA = 3

/**
 * Anima el cambio Tarde ⇄ Noche: un solo número (`uAmbience`, compartido por todos los shaders) y
 * la exposición del tone mapping, que también viene de cada horneado. La cámara no se toca.
 * También aplica la exposición de la entrada animada: negro hasta que el cuarto carga, y después sube.
 */
export function AmbienceDriver() {
  useFrame(({ gl }, delta) => {
    const target = AMBIENCE_VALUE[useSceneStore.getState().ambience]
    const uniform = ambienceUniforms.uAmbience
    if (Math.abs(uniform.value - target) > 0.0005) uniform.value = MathUtils.damp(uniform.value, target, LAMBDA, delta)
    else uniform.value = target
    const steps = MathUtils.lerp(AMBIENCE_EXPOSURE.tarde, AMBIENCE_EXPOSURE.noche, uniform.value)
    if (intro.elapsed >= 0) intro.elapsed += delta
    gl.toneMappingExposure = 2 ** steps * introExposure(intro.elapsed)
  })
  return null
}
