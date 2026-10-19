import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ITEMS, type Item } from '../data/items'
import { initialState, useSceneStore } from '../state/sceneStore'
import { DetailsDrawer } from './DetailsDrawer'

const select = (id: string) => act(() => useSceneStore.getState().select(id))
const panel = () => screen.getByRole('complementary')

describe('DetailsDrawer', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('cerrado en la vista general: fuera de los lectores de pantalla', () => {
    render(<DetailsDrawer />)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('al enfocar el monitor vertical: "03 / 07", SETUP, nombre, descripción y ficha', () => {
    render(<DetailsDrawer />)
    select('vertical-monitor')
    const item = ITEMS.find((i) => i.id === 'vertical-monitor')!
    expect(within(panel()).getByText('03 / 07')).toBeInTheDocument()
    expect(within(panel()).getByText('SETUP · 03')).toBeInTheDocument()
    expect(within(panel()).getByRole('heading', { name: item.name })).toBeInTheDocument()
    expect(within(panel()).getByText(item.description)).toBeInTheDocument()
    for (const detail of item.details!) expect(within(panel()).getByText(detail.value)).toBeInTheDocument()
  })

  it('sin detalles ni fotos: sin secciones ni marcos vacíos', () => {
    const plain: Item = { ...ITEMS[0], id: 'x', details: undefined, photos: undefined }
    render(<DetailsDrawer items={[plain]} />)
    select('x')
    expect(within(panel()).queryByRole('term')).not.toBeInTheDocument()
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument()
  })

  it('con fotos: la primera grande y todas con texto alternativo', () => {
    const withPhotos: Item = {
      ...ITEMS[0],
      id: 'x',
      photos: [
        { src: '/a.jpg', alt: 'Frente' },
        { src: '/b.jpg', alt: 'Detalle' },
      ],
    }
    render(<DetailsDrawer items={[withPhotos]} />)
    select('x')
    const images = within(panel()).getAllByRole('img')
    expect(images.map((img) => img.getAttribute('alt'))).toEqual(['Frente', 'Detalle'])
    expect(images[0]).toHaveClass('drawer__photo--main')
  })

  it('Siguiente pasa al objeto 05 y el contador se actualiza; desde el último vuelve al primero', async () => {
    render(<DetailsDrawer />)
    select('keyboard')
    await userEvent.click(within(panel()).getByRole('button', { name: /Siguiente/ }))
    expect(useSceneStore.getState().selectedId).toBe('jersey-2008')
    expect(within(panel()).getByText('05 / 07')).toBeInTheDocument()
    select('poster')
    await userEvent.click(within(panel()).getByRole('button', { name: /Siguiente/ }))
    expect(useSceneStore.getState().selectedId).toBe('desk')
  })

  it('Volver cierra el panel y vuelve a la vista general', async () => {
    render(<DetailsDrawer />)
    select('keyboard')
    await userEvent.click(within(panel()).getByRole('button', { name: /Volver/ }))
    expect(useSceneStore.getState().mode).toBe('overview')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
