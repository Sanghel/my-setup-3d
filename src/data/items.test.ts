import { describe, expect, it } from 'vitest'
import { groupedItems, ITEMS, itemById, itemCategory, itemNumber, itemTotal } from './items'

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

describe('numeración y grupos (índice del mock)', () => {
  it('numera del 01 al 07 en el orden del catálogo, con total "07"', () => {
    expect(ITEMS.map((item) => itemNumber(item.id))).toEqual(['01', '02', '03', '04', '05', '06', '07'])
    expect(itemNumber('no-existe')).toBe('')
    expect(itemTotal()).toBe('07')
  })

  it('agrupa SETUP (01–04) y COLECCIÓN (05–07); DETALLES no aparece porque no tiene objetos', () => {
    const groups = groupedItems()
    expect(groups.map((g) => g.title)).toEqual(['SETUP', 'COLECCIÓN'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['desk', 'ultrawide', 'vertical-monitor', 'keyboard'])
    expect(groups[1].items.map((i) => i.id)).toEqual(['jersey-2008', 'jersey-scholes', 'poster'])
  })

  it('un grupo vuelve a aparecer en cuanto tiene un objeto (preparado para 10)', () => {
    const funko = { ...ITEMS[0], id: 'funko', node: 'item_funko', group: 'detalles' as const }
    expect(groupedItems([...ITEMS, funko]).map((g) => g.title)).toEqual(['SETUP', 'COLECCIÓN', 'DETALLES'])
  })

  it('la categoría combina grupo y número', () => {
    expect(itemCategory(itemById('vertical-monitor')!)).toBe('SETUP · 03')
  })

  it('ningún objeto publica fotos todavía', () => {
    expect(ITEMS.every((item) => !item.photos || item.photos.length === 0)).toBe(true)
  })
})
