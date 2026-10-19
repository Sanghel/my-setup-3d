import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { AmbienceToggle } from './AmbienceToggle'

describe('AmbienceToggle', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('anuncia el grupo y marca Tarde como activa al abrir', () => {
    render(<AmbienceToggle />)
    expect(screen.getByRole('group', { name: 'Ambiente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tarde' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Noche' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('pulsar Noche cambia el ambiente y el estado activo', async () => {
    render(<AmbienceToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Noche' }))
    expect(useSceneStore.getState().ambience).toBe('noche')
    expect(screen.getByRole('button', { name: 'Noche' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cambiar durante la inspección no la cierra', async () => {
    render(<AmbienceToggle />)
    act(() => useSceneStore.getState().select('jersey-2008'))
    await userEvent.click(screen.getByRole('button', { name: 'Noche' }))
    expect(useSceneStore.getState()).toMatchObject({ mode: 'inspecting', selectedId: 'jersey-2008', ambience: 'noche' })
  })
})
