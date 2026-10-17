// Imprime el peso del .glb crudo (Blender) y del optimizado (gltf-transform).
import { statSync } from 'node:fs'

const kb = (path) => (statSync(path).size / 1024).toFixed(1)
const raw = 'public/models/room.raw.glb'
const optimized = 'public/models/room.glb'
const ratio = ((1 - statSync(optimized).size / statSync(raw).size) * 100).toFixed(0)
console.log(`[assets] ${raw}: ${kb(raw)} KB → ${optimized}: ${kb(optimized)} KB (−${ratio} %)`)
