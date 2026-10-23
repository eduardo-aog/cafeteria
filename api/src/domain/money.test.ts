import { describe, expect, it } from 'vitest'
import { formatBs, formatUsd, lineTotal, percentDiscount, usdToBsCents } from './money.js'

describe('money', () => {
  it('convierte dólares a bolívares en céntimos', () => {
    expect(usdToBsCents(400, 88623)).toBe(354492)
  })

  it('redondea la conversión al céntimo más cercano', () => {
    expect(usdToBsCents(375, 88730)).toBe(332738) // 332737,5
  })

  it('formatea bolívares', () => {
    expect(formatBs(354492)).toBe('Bs 3.544,92')
    expect(formatBs(5)).toBe('Bs 0,05')
    expect(formatBs(0)).toBe('Bs 0,00')
  })

  it('formatea dólares', () => {
    expect(formatUsd(125050)).toBe('$1.250,50')
    expect(formatUsd(400)).toBe('$4,00')
    expect(formatUsd(100000000)).toBe('$1.000.000,00')
  })

  it('formatea montos negativos', () => {
    expect(formatUsd(-250)).toBe('-$2,50')
  })

  it('el 50 % de 375 es 188', () => {
    expect(percentDiscount(375, 50)).toBe(188)
  })

  it('el total de una línea nunca es menor que 0', () => {
    expect(lineTotal(400, 200)).toBe(200)
    expect(lineTotal(400, 400)).toBe(0)
    expect(lineTotal(400, 500)).toBe(0)
  })
})
