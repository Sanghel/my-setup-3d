import { describe, expect, it } from 'vitest'
import { groupedItems, ITEMS, itemById, itemCategory, itemNumber, itemTotal } from './items'

describe('catálogo de objetos', () => {
  it('tiene los 10 objetos del mock más las portátiles', () => {
    expect(ITEMS).toHaveLength(11)
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
  it('numera del 01 al 11 en el orden del catálogo, con total "11"', () => {
    expect(ITEMS.map((item) => itemNumber(item.id))).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'])
    expect(itemNumber('no-existe')).toBe('')
    expect(itemTotal()).toBe('11')
  })

  it('agrupa en SETUP (01–06), COLECCIÓN (07–09) y DETALLES (10–11)', () => {
    const groups = groupedItems()
    expect(groups.map((g) => g.title)).toEqual(['SETUP', 'COLECCIÓN', 'DETALLES'])
    expect(groups[0].items.map((i) => i.id)).toEqual(['desk', 'ultrawide', 'vertical-monitor', 'keyboard', 'chair', 'laptops'])
    expect(groups[1].items.map((i) => i.id)).toEqual(['jersey-2008', 'jersey-scholes', 'poster'])
    expect(groups[2].items.map((i) => i.id)).toEqual(['pegboard', 'funko'])
  })

  it('un grupo sin objetos no aparece', () => {
    const sinDetalles = ITEMS.filter((item) => item.group !== 'detalles')
    expect(groupedItems(sinDetalles).map((g) => g.title)).toEqual(['SETUP', 'COLECCIÓN'])
  })

  it('la categoría combina grupo y número', () => {
    expect(itemCategory(itemById('vertical-monitor')!)).toBe('SETUP · 03')
  })

  it('los productos llevan fotos oficiales con crédito; los personalizados y el vertical (modelo pendiente), ninguna', () => {
    const withPhotos = ITEMS.filter((item) => item.photos?.length).map((item) => item.id)
    expect(withPhotos).toEqual(['ultrawide', 'vertical-monitor', 'keyboard', 'chair', 'laptops', 'pegboard', 'funko'])
    for (const item of ITEMS) for (const photo of item.photos ?? []) expect(photo.credit?.url).toMatch(/^https:\/\//)
  })

  it('enlaces de compra: solo los confirmados, limpios (sin parámetros ni afiliado)', () => {
    const withBuy = ITEMS.filter((item) => item.buy?.length).map((item) => item.id)
    expect(withBuy).toEqual(['ultrawide', 'vertical-monitor', 'keyboard', 'chair', 'pegboard', 'funko'])
    for (const link of ITEMS.flatMap((item) => item.buy ?? [])) {
      const url = new URL(link.url)
      expect(url.protocol).toBe('https:')
      expect(url.search).toBe('')
      if (link.store === 'Amazon') expect(url.href).toMatch(/^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}$/)
    }
  })
})
