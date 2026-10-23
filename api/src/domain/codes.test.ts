import { describe, expect, it } from 'vitest'
import { generatePickupCode, isValidReference, PICKUP_CODE_ALPHABET } from './codes.js'

describe('generatePickupCode', () => {
  it('genera 6 caracteres del alfabeto sin I, L, O, 0 ni 1', () => {
    for (let i = 0; i < 500; i++) {
      const code = generatePickupCode()
      expect(code).toMatch(new RegExp(`^[${PICKUP_CODE_ALPHABET}]{6}$`))
      expect(code).not.toMatch(/[ILO01]/)
    }
  })
})

describe('isValidReference', () => {
  it('acepta de 6 a 22 dígitos', () => {
    expect(isValidReference('123456')).toBe(true)
    expect(isValidReference('1'.repeat(22))).toBe(true)
  })

  it('rechaza menos de 6, más de 22 y lo que no sea dígito', () => {
    expect(isValidReference('12345')).toBe(false)
    expect(isValidReference('1'.repeat(23))).toBe(false)
    expect(isValidReference('12345a')).toBe(false)
    expect(isValidReference('123 456')).toBe(false)
    expect(isValidReference('')).toBe(false)
  })
})
