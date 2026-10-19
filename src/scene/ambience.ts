import { ShaderChunk, type MeshStandardMaterial, type Texture, type WebGLProgramParametersWithUniforms } from 'three'
import lightmap from '../../public/models/lightmap.json'
import type { Ambience } from '../state/sceneStore'

/**
 * Mezcla de los ambientes Tarde y Noche en el shader (redesign-showroom-style, D1).
 *
 * Los dos lightmaps se hornearon sobre la MISMA UV2. Cada material estándar recibe:
 * - `lightMap` = noche (así three.js define USE_LIGHTMAP y la UV del lightmap), y
 * - un segundo sampler `lightMapTarde`, más los factores k de cada uno.
 * El reemplazo de una línea de `lights_fragment_maps` mezcla las dos irradiancias con `uAmbience`
 * (0 = tarde, 1 = noche). Los uniforms son OBJETOS COMPARTIDOS por todos los materiales: animar
 * `uAmbience.value` cambia todo el cuarto en el mismo cuadro, sin recompilar ningún shader.
 * `lightMapIntensity` queda libre para el atenuado de la inspección (useDimming).
 */
export const ambienceUniforms = {
  uAmbience: { value: 0 },
  lightMapTarde: { value: null as Texture | null },
  kTarde: { value: lightmap.ambiences.tarde.intensity },
  kNoche: { value: lightmap.ambiences.noche.intensity },
  windowTarde: { value: null as Texture | null },
}

/** Valor de `uAmbience` para cada ambiente. */
export const AMBIENCE_VALUE: Record<Ambience, number> = { tarde: 0, noche: 1 }

/** Exposición (en pasos, como en Blender) por ambiente: viene del horneado, en lightmap.json. */
export const AMBIENCE_EXPOSURE: Record<Ambience, number> = {
  tarde: lightmap.ambiences.tarde.exposure,
  noche: lightmap.ambiences.noche.exposure,
}

/** Intensidad del exterior de la ventana por ambiente (la misma que usó Blender al hornear). */
const WINDOW_STRENGTH = { tarde: 1.0, noche: 0.35 }

const LIGHTMAP_LINE = 'vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;'
const LIGHTMAP_MIX = /* glsl */ `
  vec3 lightMapTardeTexel = texture2D( lightMapTarde, vLightMapUv ).rgb;
  vec3 lightMapIrradiance = mix( lightMapTardeTexel * kTarde, lightMapTexel.rgb * kNoche, uAmbience ) * lightMapIntensity;`

const shared = (shader: WebGLProgramParametersWithUniforms, names: (keyof typeof ambienceUniforms)[]) => {
  for (const name of names) shader.uniforms[name] = ambienceUniforms[name]
}

/** Prepara un material con luz horneada para mezclar los dos ambientes. */
export function patchAmbienceLightmap(material: MeshStandardMaterial, noche: Texture) {
  material.lightMap = noche
  material.lightMapIntensity = 1 // la luz real la dan kTarde / kNoche; esto queda para el atenuado
  material.onBeforeCompile = (shader) => {
    shared(shader, ['uAmbience', 'lightMapTarde', 'kTarde', 'kNoche'])
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      'uniform sampler2D lightMapTarde;\nuniform float uAmbience, kTarde, kNoche;\nvoid main() {',
    )
    shader.fragmentShader = expandChunk(shader.fragmentShader, 'lights_fragment_maps', LIGHTMAP_LINE, LIGHTMAP_MIX)
  }
  // Todos los materiales parchados comparten el mismo programa (y el mismo caché de shaders)
  material.customProgramCacheKey = () => 'ambience-lightmap'
  material.needsUpdate = true
}

/**
 * El exterior de la ventana: emisión = mezcla del cielo de tarde y la ciudad de noche, cada uno con
 * la intensidad con la que se horneó. `emissiveIntensity` queda libre para el atenuado.
 */
export function patchWindowView(material: MeshStandardMaterial) {
  material.emissiveIntensity = 1
  material.onBeforeCompile = (shader) => {
    shared(shader, ['uAmbience', 'windowTarde'])
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      'uniform sampler2D windowTarde;\nuniform float uAmbience;\nvoid main() {',
    )
    shader.fragmentShader = expandChunk(
      shader.fragmentShader,
      'emissivemap_fragment',
      'totalEmissiveRadiance *= emissiveColor.rgb;',
      /* glsl */ `
  vec3 windowTardeColor = texture2D( windowTarde, vEmissiveMapUv ).rgb * ${WINDOW_STRENGTH.tarde.toFixed(2)};
  totalEmissiveRadiance *= mix( windowTardeColor, emissiveColor.rgb * ${WINDOW_STRENGTH.noche.toFixed(2)}, uAmbience );`,
    )
  }
  material.customProgramCacheKey = () => 'ambience-window'
  material.needsUpdate = true
}

/**
 * Reemplaza una línea DENTRO de un chunk de three.js: el chunk se expande primero (`#include` →
 * su código) y luego se reemplaza la línea. Si three.js cambia esa línea en otra versión, falla
 * de forma visible en vez de mezclar mal sin avisar.
 */
function expandChunk(source: string, chunk: string, line: string, replacement: string) {
  const include = `#include <${chunk}>`
  const code = (ShaderChunk as Record<string, string>)[chunk]
  if (!code || !code.includes(line)) throw new Error(`[ambience] three.js cambió el chunk ${chunk}`)
  return source.replace(include, code.replace(line, replacement))
}

