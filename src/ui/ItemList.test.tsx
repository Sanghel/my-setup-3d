import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../data/items'
import { initialState, useSceneStore } from '../state/sceneStore'
import { ItemList } from './ItemList'

describe('ItemList', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('lista los 7 objetos como botones', () => {
    render(<ItemList items={ITEMS} />)
    const list = screen.getByRole('navigation', { name: /objetos del cuarto/i })
    expect(list).toBeInTheDocument()
    for (const item of ITEMS) expect(screen.getByRole('button', { name: item.name })).toBeInTheDocument()
  })

  it('solo con teclado: Tab hasta "Escritorio" y Enter lo inspecciona', async () => {
    render(<ItemList items={ITEMS} />)
    const user = userEvent.setup()
    await user.tab() // botón "Objetos" (plegar/desplegar)
    await user.tab() // primer objeto: Escritorio
    expect(screen.getByRole('button', { name: 'Escritorio' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(useSceneStore.getState()).toMatchObject({ mode: 'inspecting', selectedId: 'desk' })
  })

  it('marca el objeto inspeccionado con aria-current y permite saltar a otro', async () => {
    render(<ItemList items={ITEMS} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Teclado' }))
    expect(screen.getByRole('button', { name: 'Teclado' })).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: 'Monitor ultrawide' }))
    expect(useSceneStore.getState().selectedId).toBe('ultrawide')
    expect(screen.getByRole('button', { name: 'Teclado' })).not.toHaveAttribute('aria-current')
  })

  it('se puede plegar y desplegar', async () => {
    render(<ItemList items={ITEMS} defaultOpen={false} />)
    const toggle = screen.getByRole('button', { name: /objetos/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Escritorio' })).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Escritorio' })).toBeInTheDocument()
  })
})
