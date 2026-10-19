import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { TiltShift } from './TiltShift'

describe('TiltShift', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('está activo en la vista general y se desvanece al inspeccionar', () => {
    const { container } = render(<TiltShift />)
    const root = container.firstElementChild!
    expect(root).not.toHaveClass('tilt-shift--off')
    act(() => useSceneStore.getState().select('keyboard'))
    expect(root).toHaveClass('tilt-shift--off')
  })

  it('es decorativo: oculto para lectores de pantalla', () => {
    const { container } = render(<TiltShift />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
