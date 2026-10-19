import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoadError } from './LoadError'

function Broken(): never {
  throw new Error('Could not load /models/room.glb: Failed to fetch')
}

describe('LoadError', () => {
  it('muestra un mensaje y "Reintentar" en vez de una pantalla en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // React registra el error capturado
    render(
      <LoadError>
        <Broken />
      </LoadError>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el cuarto')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
