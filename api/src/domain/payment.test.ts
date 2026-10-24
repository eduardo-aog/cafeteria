import { describe, expect, it } from 'vitest'
import { buildPaymentText, formatPaymentDoc, formatPhone } from './payment.js'

describe('formatPaymentDoc', () => {
  it('el RIF de 9 dígitos se muestra como J-12345678-9', () => {
    expect(formatPaymentDoc('J', '123456789')).toBe('J-12345678-9')
    expect(formatPaymentDoc('G', '200012345')).toBe('G-20001234-5')
  })

  it('la cédula se muestra sin separar', () => {
    expect(formatPaymentDoc('V', '12345678')).toBe('V-12345678')
    expect(formatPaymentDoc('E', '123456')).toBe('E-123456')
  })
})

describe('formatPhone', () => {
  it('04141234567 → 0414-1234567', () => {
    expect(formatPhone('04141234567')).toBe('0414-1234567')
  })
})

describe('buildPaymentText', () => {
  it('arma el texto de COPIAR TODO', () => {
    const text = buildPaymentText({
      bankCode: '0134',
      bankName: 'Banesco',
      docType: 'J',
      docNumber: '123456789',
      phone: '04141234567',
      amountBsCents: 354492,
    })
    expect(text).toBe(
      'Pago Móvil\nBanco: 0134 - Banesco\nDocumento: J-12345678-9\nTeléfono: 0414-1234567\nMonto: Bs 3.544,92',
    )
  })
})
