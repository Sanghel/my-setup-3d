import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useSceneStore } from '../state/sceneStore'
import { Signature } from './Brand'

describe('Signature', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('dice "Crafted with ♥ and Claude · Three.js — by Sanghel Gonzalez", con el corazón anunciado como "love"', () => {
    render(<Signature />)
    const signature = screen.getByText(/Crafted with/)
    expect(signature).toHaveTextContent(/^Crafted with\s*and\s*Claude\s*·\s*Three\.js\s*—\s*by Sanghel Gonzalez$/)
    expect(screen.getByRole('img', { name: 'love' })).toBeInTheDocument()
  })

  it('Claude y three.js enlazan a sus sitios en una pestaña nueva', () => {
    render(<Signature />)
    const claude = screen.getByRole('link', { name: 'Claude' })
    const three = screen.getByRole('link', { name: 'Three.js' })
    expect(claude).toHaveAttribute('href', 'https://claude.com')
    expect(three).toHaveAttribute('href', 'https://threejs.org')
    for (const link of [claude, three]) expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('"Sanghel Gonzalez" enlaza al portfolio en una pestaña nueva, destacado', () => {
    render(<Signature />)
    const author = screen.getByRole('link', { name: 'Sanghel Gonzalez' })
    expect(author).toHaveAttribute('href', 'https://sanghel.dev')
    expect(author).toHaveAttribute('target', '_blank')
    expect(author).toHaveAttribute('rel', 'noopener noreferrer')
    expect(author).toHaveClass('signature__author')
  })

  it('se oculta al inspeccionar (y sus enlaces salen del orden de tabulación)', () => {
    render(<Signature />)
    act(() => useSceneStore.getState().select('desk'))
    expect(screen.getByText(/Crafted with/, { ignore: '' })).toHaveClass('signature--off')
    expect(screen.getByRole('link', { name: 'Claude', hidden: true })).toHaveAttribute('tabindex', '-1')
  })
})
