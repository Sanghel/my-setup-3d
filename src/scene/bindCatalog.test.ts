import { describe, expect, it } from 'vitest'
import { Group, Mesh, Object3D } from 'three'
import type { Item } from '../data/items'
import { bindCatalog, itemIdOf } from './bindCatalog'

const item = (id: string, node: string): Item => ({
  id,
  node,
  name: id,
  group: 'setup',
  description: id,
  view: { azimuth: 0, polar: 90, azimuthRange: [-45, 45] },
})

/** Escena falsa con la misma forma que el .glb: un nodo item_* con piezas y un nodo room_*. */
function fakeScene() {
  const scene = new Object3D()
  const keyboard = new Group()
  keyboard.name = 'item_keyboard'
  const keys = new Mesh()
  keys.name = 'keyboard_keys'
  keyboard.add(keys)
  const floor = new Mesh()
  floor.name = 'room_floor'
  scene.add(keyboard, floor)
  return { scene, keyboard, keys, floor }
}

describe('bindCatalog', () => {
  it('marca el nodo del catálogo y TODAS sus piezas con el id del objeto', () => {
    const { scene, keyboard, keys } = fakeScene()
    const { roots, missing } = bindCatalog(scene, [item('keyboard', 'item_keyboard')])
    expect(roots.get('keyboard')).toBe(keyboard)
    expect(itemIdOf(keys)).toBe('keyboard')
    expect(missing).toEqual([])
  })

  it('lo que no está en el catálogo queda sin marcar (no interactivo)', () => {
    const { scene, keys, floor } = fakeScene()
    bindCatalog(scene, [])
    expect(itemIdOf(keys)).toBeUndefined()
    expect(itemIdOf(floor)).toBeUndefined()
  })

  it('informa los objetos del catálogo cuyo nodo no existe', () => {
    const { scene } = fakeScene()
    const { roots, missing } = bindCatalog(scene, [item('poster', 'item_poster')])
    expect(roots.size).toBe(0)
    expect(missing).toEqual(['poster'])
  })
})
