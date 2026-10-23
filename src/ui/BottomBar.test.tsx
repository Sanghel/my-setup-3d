import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { BottomBar } from './BottomBar'

describe('BottomBar', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('tiene el selector de ambiente y el botón de los puntos, sin "Vista general"', () => {
    render(<BottomBar />)
    expect(screen.getByRole('group', { name: 'Ambiente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ocultar puntos/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vista general' })).not.toBeInTheDocument()
  })

  it('el botón de los puntos los oculta y los vuelve a mostrar', async () => {
    render(<BottomBar />)
    const button = screen.getByRole('button', { name: /Ocultar puntos/ })
    await userEvent.click(button)
    expect(useSceneStore.getState().hotspotsVisible).toBe(false)
    expect(button).toHaveAccessibleName(/Mostrar puntos/)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
