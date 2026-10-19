// @vitest-environment node
import { readFileSync, statSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Document } from '@gltf-transform/core'
import { ITEMS } from '../../src/data/items.ts'

/*
 * Contrato entre Blender y la web: room.glb (generado por `npm run assets` y commiteado)
 * debe tener los nodos que la escena espera y respetar el presupuesto de peso de la spec.
 */

const GLB = 'public/models/room.glb'
const LIGHTMAP_META = 'public/models/lightmap.json'
// Un lightmap por ambiente (redesign-showroom-style D1/D2), horneados sobre la misma UV2
const AMBIENCES = ['tarde', 'noche'] as const
const ambienceLightmap = (name: string) => `public/models/lightmap-${name}.webp`
const MAX_BYTES = 15 * 1024 * 1024 // spec room-scene: descarga inicial ≤ 15 MB

const ROOM_NODES = [
  'room_floor',
  'room_wall_back',
  'room_wall_side',
  'room_baseboard',
  'room_window_frame',
  'room_window_glass',
]

// Objetos seleccionables (spec room-scene: "Objetos del primer lote"). Cada uno es un nodo
// agrupador con sus piezas como hijos.
const ITEM_NODES = [
  'item_desk',
  'item_ultrawide',
  'item_vertical_monitor',
  'item_keyboard',
  'item_jersey_2008',
  'item_jersey_scholes',
  'item_poster',
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
  it('el modelo y sus lightmaps pesan juntos como máximo 15 MB', () => {
    const lightmaps = AMBIENCES.reduce((sum, name) => sum + statSync(ambienceLightmap(name)).size, 0)
    expect(statSync(GLB).size + lightmaps).toBeLessThanOrEqual(MAX_BYTES)
  })

  it.each(AMBIENCES)('tiene el lightmap de %s con su intensidad y exposición', (name) => {
    const meta = JSON.parse(readFileSync(LIGHTMAP_META, 'utf8'))
    expect(meta.ambiences[name].intensity).toBeGreaterThan(0)
    expect(typeof meta.ambiences[name].exposure).toBe('number')
    expect(statSync(ambienceLightmap(name)).size).toBeGreaterThan(0)
  })

  it('la metadata del lightmap declara la UV del lightmap', () => {
    expect(JSON.parse(readFileSync(LIGHTMAP_META, 'utf8')).uv).toBe('TEXCOORD_1')
  })

  it.each(ROOM_NODES)('tiene el nodo %s con geometría', (name) => {
    const node = doc
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === name)
    expect(node, `falta el nodo ${name}: ¿cambió su nombre en blender/scripts?`).toBeDefined()
    expect(node?.getMesh()).not.toBeNull()
  })

  it.each(ITEM_NODES)('tiene el objeto %s con piezas', (name) => {
    const node = doc
      .getRoot()
      .listNodes()
      .find((n) => n.getName() === name)
    expect(node, `falta el objeto ${name}: ¿cambió su nombre en blender/scripts/lib/setup.py?`).toBeDefined()
    const meshes = node!.listChildren().filter((child) => child.getMesh() !== null)
    expect(meshes.length).toBeGreaterThan(0)
  })

  it('toda malla que recibe luz horneada tiene el segundo set de UV (TEXCOORD_1)', () => {
    // Las que emiten o son transparentes no se hornean (blender/scripts/lib/bake.py)
    const skip = (name: string) => name.endsWith('_screen') || name.includes('glass')
    const missing = doc
      .getRoot()
      .listMeshes()
      .filter((mesh) => !skip(mesh.getName()))
      .filter((mesh) => mesh.listPrimitives().some((prim) => !prim.getAttribute('TEXCOORD_1')))
      .map((mesh) => mesh.getName())
    expect(missing).toEqual([])
  })

  it('no exporta las mallas de luz led_* (solo iluminan al hornear)', () => {
    const leds = doc.getRoot().listNodes().filter((n) => n.getName().startsWith('led_'))
    expect(leds).toEqual([])
  })

  it.each(ITEMS)('el nodo $node del catálogo existe en el .glb', ({ node }) => {
    expect(doc.getRoot().listNodes().some((n) => n.getName() === node)).toBe(true)
  })
})
