import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../data/items'
import { initialState, useSceneStore } from '../state/sceneStore'
import { DetailsPanel } from './DetailsPanel'

const select = (id: string) => act(() => useSceneStore.getState().select(id))

describe('DetailsPanel', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('no se muestra en la vista general', () => {
    render(<DetailsPanel items={ITEMS} />)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('muestra nombre, descripción y detalles del objeto seleccionado', () => {
    render(<DetailsPanel items={ITEMS} />)
    select('vertical-monitor')
    const item = ITEMS.find((i) => i.id === 'vertical-monitor')!
    expect(screen.getByRole('heading', { name: item.name })).toBeInTheDocument()
    expect(screen.getByText(item.description)).toBeInTheDocument()
    for (const detail of item.details!) {
      expect(screen.getByText(detail.label)).toBeInTheDocument()
      expect(screen.getByText(detail.value)).toBeInTheDocument()
    }
  })

  it('no renderiza la sección de detalles si el objeto no tiene', () => {
    const sinDetalles = { ...ITEMS[0], id: 'x', details: undefined }
    render(<DetailsPanel items={[sinDetalles]} />)
    select('x')
    expect(screen.getByRole('heading', { name: sinDetalles.name })).toBeInTheDocument()
    expect(screen.queryByRole('term')).not.toBeInTheDocument() // <dt> de la lista de detalles
  })

  it('al cambiar de objeto, muestra el nuevo', () => {
    render(<DetailsPanel items={ITEMS} />)
    select('keyboard')
    select('poster')
    expect(screen.getByRole('heading', { name: 'Old Trafford' })).toBeInTheDocument()
  })
})
