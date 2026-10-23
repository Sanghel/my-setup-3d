import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ITEMS, type Item } from '../data/items'
import { initialState, useSceneStore } from '../state/sceneStore'
import { DetailsDrawer } from './DetailsDrawer'

const select = (id: string) => act(() => useSceneStore.getState().select(id))
const panel = () => screen.getByRole('complementary')

describe('DetailsDrawer', () => {
  beforeEach(() => useSceneStore.setState(initialState))

  it('cerrado en la vista general: fuera de los lectores de pantalla', () => {
    render(<DetailsDrawer />)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('al enfocar el monitor vertical: el 03 grande, "SETUP · 03 DE 11", nombre, descripción y ficha en tarjetas', () => {
    render(<DetailsDrawer />)
    select('vertical-monitor')
    const item = ITEMS.find((i) => i.id === 'vertical-monitor')!
    expect(panel().querySelector('.drawer__number')).toHaveTextContent('03')
    expect(within(panel()).getByText('SETUP · 03 DE 11')).toBeInTheDocument()
    expect(within(panel()).getByRole('heading', { name: item.name })).toBeInTheDocument()
    expect(within(panel()).getByText(item.description)).toBeInTheDocument()
    for (const detail of item.details!) expect(within(panel()).getByText(detail.value)).toBeInTheDocument()
  })

  it('sin detalles ni fotos: sin secciones ni marcos vacíos', () => {
    const plain: Item = { ...ITEMS[0], id: 'x', details: undefined, photos: undefined, cover: undefined }
    render(<DetailsDrawer items={[plain]} />)
    select('x')
    expect(within(panel()).queryByRole('term')).not.toBeInTheDocument()
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument()
  })

  it('con fotos: la primera en la cabecera, las demás como miniaturas, todas con texto alternativo', () => {
    const withPhotos: Item = {
      ...ITEMS[0],
      cover: undefined,
      id: 'x',
      photos: [
        { src: '/a.jpg', alt: 'Frente' },
        { src: '/b.jpg', alt: 'Detalle' },
      ],
    }
    render(<DetailsDrawer items={[withPhotos]} />)
    select('x')
    const images = within(panel()).getAllByRole('img')
    expect(images.map((img) => img.getAttribute('alt'))).toEqual(['Frente', 'Detalle'])
    expect(images[0]).toHaveClass('drawer__photo--main')
    expect(images[1]).toHaveClass('drawer__photo')
  })

  it('las fotos se cargan solo al abrir el panel (loading="lazy")', () => {
    render(<DetailsDrawer />)
    select('ultrawide')
    for (const img of within(panel()).getAllByRole('img')) expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('teclado: fotos oficiales del MX Mechanical Mini y del MX Master 3S, con crédito "Fotos: Logitech"', () => {
    render(<DetailsDrawer />)
    select('keyboard')
    const alts = within(panel()).getAllByRole('img').map((img) => img.getAttribute('alt'))
    expect(alts.some((alt) => alt?.includes('MX Mechanical Mini'))).toBe(true)
    expect(alts.some((alt) => alt?.includes('MX Master 3S'))).toBe(true)
    const credit = panel().querySelector('.drawer__credit')!
    expect(credit.textContent).toMatch(/^Fotos: Logitech/)
    expect(within(credit as HTMLElement).getAllByRole('link')).toHaveLength(1)
  })

  it('organizador: el crédito nombra a JBL y a PlayStation, cada uno con enlace en pestaña nueva', () => {
    render(<DetailsDrawer />)
    select('pegboard')
    const links = within(panel().querySelector('.drawer__credit') as HTMLElement).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'JBL (se abre en una pestaña nueva)',
      'PlayStation (se abre en una pestaña nueva)',
    ])
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('ultrawide: "Ver en Amazon" abre el G34WQi en pestaña nueva, sin afiliado y con nombre accesible', () => {
    render(<DetailsDrawer />)
    select('ultrawide')
    const link = within(panel()).getByRole('link', { name: /Xiaomi G34WQi en Amazon/ })
    expect(link).toHaveTextContent('Ver en Amazon')
    expect(link).toHaveAccessibleName('Ver Xiaomi G34WQi en Amazon (se abre en una pestaña nueva)')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.getAttribute('href')).toMatch(/^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}$/)
  })

  it('silla: el botón dice "Ver en Mublex"', () => {
    render(<DetailsDrawer />)
    select('chair')
    expect(within(panel()).getByRole('link', { name: /en Mublex/ })).toHaveTextContent('Ver en Mublex')
  })

  it('objetos con dos productos: un botón por producto', () => {
    render(<DetailsDrawer />)
    select('keyboard')
    const buy = () => [...panel().querySelectorAll('.drawer__buy-link')].map((a) => a.textContent)
    expect(buy()).toEqual(['Ver teclado en Amazon ↗', 'Ver mouse en Amazon ↗'])
    select('pegboard')
    expect(buy()).toEqual(['Ver JBL en Amazon ↗', 'Ver DualSense en Amazon ↗'])
  })

  it('sin enlace confirmado (camiseta Scholes): sin botón de compra', () => {
    render(<DetailsDrawer />)
    select('jersey-scholes')
    expect(panel().querySelector('.drawer__buy')).toBeNull()
  })

  it('objeto personalizado (Scholes 18): la cabecera es su captura de la escena, sin galería ni crédito', () => {
    render(<DetailsDrawer />)
    select('jersey-scholes')
    const images = within(panel()).getAllByRole('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveClass('drawer__cover')
    expect(images[0].getAttribute('src')).toBe('/headers/jersey-scholes.webp')
    expect(panel().querySelector('.drawer__credit')).toBeNull()
  })

  it('el pie nombra a los vecinos: "07 Moscú 2008" y "09 Old Trafford" para el 08', async () => {
    render(<DetailsDrawer />)
    select('jersey-scholes')
    const prev = within(panel()).getByRole('button', { name: 'Anterior: Moscú 2008' })
    const next = within(panel()).getByRole('button', { name: 'Siguiente: Old Trafford' })
    expect(prev).toHaveTextContent('← 07Moscú 2008')
    expect(next).toHaveTextContent('09 →Old Trafford')
    await userEvent.click(prev)
    expect(useSceneStore.getState().selectedId).toBe('jersey-2008')
  })

  it('Siguiente pasa al objeto 05 (la silla) y el contador se actualiza; desde el último vuelve al primero', async () => {
    render(<DetailsDrawer />)
    select('keyboard')
    await userEvent.click(within(panel()).getByRole('button', { name: /Siguiente/ }))
    expect(useSceneStore.getState().selectedId).toBe('chair')
    expect(within(panel()).getByText('SETUP · 05 DE 11')).toBeInTheDocument()
    select('funko')
    await userEvent.click(within(panel()).getByRole('button', { name: /Siguiente/ }))
    expect(useSceneStore.getState().selectedId).toBe('desk')
  })

  it('Volver cierra el panel y vuelve a la vista general', async () => {
    render(<DetailsDrawer />)
    select('keyboard')
    await userEvent.click(within(panel()).getByRole('button', { name: /Volver/ }))
    expect(useSceneStore.getState().mode).toBe('overview')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
