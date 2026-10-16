// @vitest-environment node
import { readFileSync, statSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Document } from '@gltf-transform/core'

/*
 * Contrato entre Blender y la web: room.glb (generado por `npm run assets` y commiteado)
 * debe tener los nodos que la escena espera y respetar el presupuesto de peso de la spec.
 */

const GLB = 'public/models/room.glb'
const MAX_BYTES = 15 * 1024 * 1024 // spec room-scene: descarga inicial ≤ 15 MB

const ROOM_NODES = [
  'room_floor',
  'room_ceiling',
  'room_wall_back',
  'room_wall_side',
  'room_wall_left',
  'room_wall_front',
  'room_baseboard',
  'room_window_frame',
  'room_window_glass',
]

let doc: Document

beforeAll(async () => {
  await MeshoptDecoder.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
  doc = await io.readBinary(new Uint8Array(readFileSync(GLB)))
})

describe('room.glb', () => {
  it('pesa como máximo 15 MB', () => {
    expect(statSync(GLB).size).toBeLessThanOrEqual(MAX_BYTES)
  })

  it.each(ROOM_NODES)('tiene el nodo %s con geometría', (name) => {
    const node = doc
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === name)
    expect(node, `falta el nodo ${name}: ¿cambió su nombre en blender/scripts?`).toBeDefined()
    expect(node?.getMesh()).not.toBeNull()
  })
})
