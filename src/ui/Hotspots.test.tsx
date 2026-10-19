import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../data/items'
import { initialState, useSceneStore } from '../state/sceneStore'
import { Hotspots } from './Hotspots'

describe('Hotspots', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('un punto por objeto, anunciado con el nombre (no solo el número)', () => {
    render(<Hotspots />)
    for (const item of ITEMS) expect(screen.getByRole('button', { name: item.name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Camiseta final de Moscú 2008' })).toHaveTextContent('05')
  })

  it('click en un punto inspecciona su objeto', async () => {
    render(<Hotspots />)
    await userEvent.click(screen.getByRole('button', { name: 'Camiseta final de Moscú 2008' }))
    expect(useSceneStore.getState()).toMatchObject({ mode: 'inspecting', selectedId: 'jersey-2008' })
  })

  it('al pasar el puntero se destaca y muestra el nombre; el hover del objeto en la escena también', async () => {
    render(<Hotspots />)
    await userEvent.hover(screen.getByRole('button', { name: 'Teclado' }))
    expect(useSceneStore.getState().hoveredId).toBe('keyboard')
    expect(screen.getByText('Teclado', { selector: '.hotspot__label' })).toBeInTheDocument()
    act(() => useSceneStore.getState().hover('poster'))
    expect(screen.getByText('Old Trafford', { selector: '.hotspot__label' })).toBeInTheDocument()
  })

  it('se ocultan con "ocultar puntos" y en inspección (y salen del orden de tabulación)', () => {
    render(<Hotspots />)
    act(() => useSceneStore.getState().toggleHotspots())
    expect(screen.queryByRole('button', { name: 'Teclado' })).not.toBeInTheDocument() // aria-hidden
    act(() => useSceneStore.getState().toggleHotspots())
    act(() => useSceneStore.getState().select('desk'))
    expect(screen.queryByRole('button', { name: 'Teclado' })).not.toBeInTheDocument()
  })
})
