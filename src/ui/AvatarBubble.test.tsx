import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { AvatarBubble } from './AvatarBubble'

describe('AvatarBubble', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('en la vista general el muñeco saluda: "Sanghel: ¡Bienvenidos a mi setup!"', () => {
    render(<AvatarBubble />)
    expect(screen.getByText(/Bienvenidos a mi setup/)).toHaveTextContent('Sanghel: ¡Bienvenidos a mi setup!')
  })

  it('al inspeccionar se oculta junto con el muñeco', () => {
    const { container } = render(<AvatarBubble />)
    act(() => useSceneStore.getState().select('desk'))
    expect(container.firstChild).toHaveClass('avatar-bubble--hidden')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
