import { describe, expect, it } from 'vitest'
import { KEYBOARD, vox } from '../dimensions'
import { bounds } from '../voxel'
import { KEY_ROWS, KEYBOARD_COLORS, makeKeyboard } from './keyboard'

describe('makeKeyboard', () => {
  const keyboard = makeKeyboard()
  const keys = keyboard.voxels.filter(([, , , c]) => c !== KEYBOARD_COLORS.body)

  it(`tiene ${KEY_ROWS} filas de teclas`, () => {
    expect(new Set(keys.map(([, , z]) => z)).size).toBe(KEY_ROWS)
  })

  it('es low-profile: carcasa + una capa de teclas (2 voxeles de alto)', () => {
    expect(bounds(keyboard.voxels).size).toEqual([vox(KEYBOARD.width), 2, vox(KEYBOARD.depth)])
  })

  it('la barra espaciadora está en la fila más cercana al usuario', () => {
    const space = keys.filter(([, , , c]) => c === KEYBOARD_COLORS.space)
    const frontRow = Math.max(...keys.map(([, , z]) => z))
    expect(space.length).toBeGreaterThan(4)
    expect(space.every(([, , z]) => z === frontRow)).toBe(true)
  })
})
