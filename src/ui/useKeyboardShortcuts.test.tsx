import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

function Harness() {
  useKeyboardShortcuts()
  return <input aria-label="campo" />
}

const state = () => useSceneStore.getState()

describe('atajos de teclado', () => {
  beforeEach(() => {
    useSceneStore.setState(initialState)
    render(<Harness />)
  })

  it('Esc sale de la inspección', async () => {
    act(() => state().select('keyboard'))
    await userEvent.keyboard('{Escape}')
    expect(state().mode).toBe('overview')
  })

  it('N alterna tarde ⇄ noche (mayúscula o minúscula)', async () => {
    await userEvent.keyboard('n')
    expect(state().ambience).toBe('noche')
    await userEvent.keyboard('N')
    expect(state().ambience).toBe('tarde')
  })

  it('H oculta y muestra los puntos', async () => {
    await userEvent.keyboard('h')
    expect(state().hotspotsVisible).toBe(false)
    await userEvent.keyboard('h')
    expect(state().hotspotsVisible).toBe(true)
  })

  it('→ y ← recorren el catálogo en inspección', async () => {
    act(() => state().select('keyboard'))
    await userEvent.keyboard('{ArrowRight}')
    expect(state().selectedId).toBe('jersey-2008')
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(state().selectedId).toBe('vertical-monitor')
  })

  it('las flechas no hacen nada en la vista general', async () => {
    await userEvent.keyboard('{ArrowRight}')
    expect(state()).toMatchObject(initialState)
  })

  it('con Cmd/Ctrl no actúa (Cmd+N es del navegador)', async () => {
    await userEvent.keyboard('{Meta>}n{/Meta}{Control>}h{/Control}')
    expect(state()).toMatchObject(initialState)
  })

  it('mientras se escribe en un campo no actúa', async () => {
    await userEvent.click(document.querySelector('input')!)
    await userEvent.keyboard('nh')
    expect(state()).toMatchObject(initialState)
  })
})
