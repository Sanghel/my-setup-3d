import { describe, expect, it } from 'vitest'
import { ITEMS, itemById } from './items'

describe('catálogo de objetos', () => {
  it('tiene los 7 objetos del primer lote', () => {
    expect(ITEMS).toHaveLength(7)
  })

  it('los ids y los nodos son únicos', () => {
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(ITEMS.length)
    expect(new Set(ITEMS.map((item) => item.node)).size).toBe(ITEMS.length)
  })

  it.each(ITEMS)('$id tiene nombre, descripción y un nodo item_*', (item) => {
    expect(item.name.trim()).not.toBe('')
    expect(item.description.trim()).not.toBe('')
    expect(item.node).toMatch(/^item_/)
    for (const detail of item.details ?? []) {
      expect(detail.label.trim()).not.toBe('')
      expect(detail.value.trim()).not.toBe('')
    }
  })

  it('itemById encuentra por id y devuelve undefined si no existe', () => {
    expect(itemById('keyboard')?.node).toBe('item_keyboard')
    expect(itemById('no-existe')).toBeUndefined()
  })
})
