import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const progress = { active: true, progress: 0 }
vi.mock('@react-three/drei', () => ({ useProgress: () => progress }))

const { Loader } = await import('./Loader')

describe('Loader', () => {
  beforeEach(() => Object.assign(progress, { active: true, progress: 0 }))

  it('muestra el porcentaje mientras se descarga', () => {
    progress.progress = 42.4
    render(<Loader />)
    expect(screen.getByRole('status')).toHaveTextContent('42 %')
  })

  it('al terminar se desvanece (clase loader--done)', () => {
    Object.assign(progress, { active: false, progress: 100 })
    render(<Loader />)
    expect(screen.getByRole('status')).toHaveClass('loader--done')
  })
})
