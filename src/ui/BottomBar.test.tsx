import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { BottomBar } from './BottomBar'

describe('BottomBar', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('tiene el selector de ambiente y "Vista general"', () => {
    render(<BottomBar />)
    expect(screen.getByRole('group', { name: 'Ambiente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vista general' })).toBeInTheDocument()
  })

  it('"Vista general" sale de la inspección, igual que Esc', async () => {
    render(<BottomBar />)
    act(() => useSceneStore.getState().select('poster'))
    await userEvent.click(screen.getByRole('button', { name: 'Vista general' }))
    expect(useSceneStore.getState()).toMatchObject({ mode: 'overview', selectedId: null })
  })
})
