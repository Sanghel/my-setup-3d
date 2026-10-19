import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../data/items'
import { initialState, useSceneStore } from '../state/sceneStore'
import { BackButton } from './BackButton'
import { DetailsPanel } from './DetailsPanel'

const inspecting = () => act(() => useSceneStore.getState().select('keyboard'))

describe('salir del modo inspección', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('el botón "Volver" vuelve a la vista general y cierra el panel', async () => {
    render(
      <DetailsPanel items={ITEMS}>
        <BackButton />
      </DetailsPanel>,
    )
    inspecting()
    await userEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(useSceneStore.getState().mode).toBe('overview')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('la tecla Esc hace lo mismo', async () => {
    render(
      <DetailsPanel items={ITEMS}>
        <BackButton />
      </DetailsPanel>,
    )
    inspecting()
    await userEvent.keyboard('{Escape}')
    expect(useSceneStore.getState()).toMatchObject(initialState)
  })
})
