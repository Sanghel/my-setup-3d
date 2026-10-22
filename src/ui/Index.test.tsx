import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { Index } from './Index'

const names = (region: HTMLElement) => within(region).getAllByRole('button').map((b) => b.getAttribute('aria-label'))

describe('Index (riel numerado)', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('agrupa en SETUP, COLECCIÓN y DETALLES, numerados 01–11 como los puntos', () => {
    render(<Index />)
    expect(names(screen.getByRole('region', { name: 'SETUP' }))).toEqual([
      '01 Escritorio',
      '02 Ultrawide',
      '03 Vertical',
      '04 Teclado',
      '05 Silla',
      '06 Portátiles',
    ])
    expect(names(screen.getByRole('region', { name: 'COLECCIÓN' }))).toEqual(['07 Moscú 2008', '08 Scholes 18', '09 Old Trafford'])
    expect(names(screen.getByRole('region', { name: 'DETALLES' }))).toEqual(['10 Organizador', '11 Funko Madara'])
  })

  it('cada círculo muestra el número y guarda el nombre para la pastilla', () => {
    render(<Index />)
    const button = screen.getByRole('button', { name: '04 Teclado' })
    expect(button).toHaveTextContent('04Teclado')
  })

  it('solo con teclado: Tab hasta "01" y Enter lo inspecciona', async () => {
    render(<Index />)
    const user = userEvent.setup()
    await user.tab()
    expect(screen.getByRole('button', { name: '01 Escritorio' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(useSceneStore.getState()).toMatchObject({ mode: 'inspecting', selectedId: 'desk' })
  })

  it('durante la inspección permite saltar a otro objeto y marca el actual', async () => {
    render(<Index />)
    act(() => useSceneStore.getState().select('keyboard'))
    await userEvent.click(screen.getByRole('button', { name: '02 Ultrawide' }))
    expect(useSceneStore.getState().selectedId).toBe('ultrawide')
    expect(screen.getByRole('button', { name: '02 Ultrawide' })).toHaveAttribute('aria-current', 'true')
  })

  it('el hover y el foco se sincronizan con los puntos', async () => {
    render(<Index />)
    await userEvent.hover(screen.getByRole('button', { name: '04 Teclado' }))
    expect(useSceneStore.getState().hoveredId).toBe('keyboard')
    await userEvent.unhover(screen.getByRole('button', { name: '04 Teclado' }))
    act(() => screen.getByRole('button', { name: '05 Silla' }).focus())
    expect(useSceneStore.getState().hoveredId).toBe('chair')
  })

  it('el hover desde la escena despliega el círculo del objeto', () => {
    render(<Index />)
    act(() => useSceneStore.getState().hover('poster'))
    expect(screen.getByRole('button', { name: '09 Old Trafford' })).toHaveClass('index__item--hover')
  })
})
