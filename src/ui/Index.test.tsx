import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { Index } from './Index'

describe('Index', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('agrupa en SETUP, COLECCIÓN y DETALLES, numerados 01–11 como los puntos', () => {
    render(<Index />)
    const setup = screen.getByRole('region', { name: 'SETUP' })
    const coleccion = screen.getByRole('region', { name: 'COLECCIÓN' })
    expect(within(setup).getAllByRole('button').map((b) => b.textContent)).toEqual([
      '01Escritorio',
      '02Ultrawide',
      '03Vertical',
      '04Teclado',
      '05Silla',
      '06Portátiles',
    ])
    expect(within(coleccion).getAllByRole('button').map((b) => b.textContent)).toEqual([
      '07Moscú 2008',
      '08Scholes 18',
      '09Old Trafford',
    ])
    const detalles = screen.getByRole('region', { name: 'DETALLES' })
    expect(within(detalles).getAllByRole('button').map((b) => b.textContent)).toEqual(['10Organizador', '11Funko Madara'])
  })

  it('solo con teclado: Tab hasta "Escritorio" y Enter lo inspecciona', async () => {
    render(<Index />)
    const user = userEvent.setup()
    await user.tab() // "Ocultar puntos"
    await user.tab() // 01 Escritorio
    expect(screen.getByRole('button', { name: /Escritorio/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(useSceneStore.getState()).toMatchObject({ mode: 'inspecting', selectedId: 'desk' })
  })

  it('durante la inspección permite saltar a otro objeto y marca el actual', async () => {
    render(<Index />)
    act(() => useSceneStore.getState().select('keyboard'))
    await userEvent.click(screen.getByRole('button', { name: /Ultrawide/ }))
    expect(useSceneStore.getState().selectedId).toBe('ultrawide')
    expect(screen.getByRole('button', { name: /Ultrawide/ })).toHaveAttribute('aria-current', 'true')
  })

  it('el hover se sincroniza con los puntos', async () => {
    render(<Index />)
    await userEvent.hover(screen.getByRole('button', { name: /Teclado/ }))
    expect(useSceneStore.getState().hoveredId).toBe('keyboard')
  })

  it('"Ocultar puntos" alterna y cambia su texto', async () => {
    render(<Index />)
    await userEvent.click(screen.getByRole('button', { name: /Ocultar puntos/ }))
    expect(useSceneStore.getState().hotspotsVisible).toBe(false)
    expect(screen.getByRole('button', { name: /Mostrar puntos/ })).toBeInTheDocument()
  })

  it('en celular empieza plegado y se pliega al elegir con un tap', async () => {
    render(<Index collapsible defaultOpen={false} />)
    const toggle = screen.getByRole('button', { name: /ÍNDICE/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    await userEvent.click(screen.getByRole('button', { name: /Old Trafford/ }))
    expect(useSceneStore.getState().selectedId).toBe('poster')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
