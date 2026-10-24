import { describe, expect, it } from 'vitest'
import { classifyScanCode, scanRejectionMessage } from './scan.js'

describe('classifyScanCode', () => {
  it('un UUID es el contenido del QR', () => {
    const uuid = '3F2504E0-4F89-11D3-9A0C-0305E82C3301'
    expect(classifyScanCode(uuid)).toEqual({ kind: 'qr', value: uuid.toLowerCase() })
  })

  it('el código corto no distingue mayúsculas ni espacios', () => {
    expect(classifyScanCode(' k7f2m9 ')).toEqual({ kind: 'code', value: 'K7F2M9' })
  })

  it('lo demás no es un código', () => {
    expect(classifyScanCode('')).toBeNull()
    expect(classifyScanCode('K7F2M')).toBeNull()
    expect(classifyScanCode('K7F2M9X')).toBeNull()
    expect(classifyScanCode('K7F-M9')).toBeNull()
    expect(classifyScanCode('no-es-un-uuid')).toBeNull()
  })
})

describe('scanRejectionMessage', () => {
  it('explica cada estado', () => {
    expect(scanRejectionMessage('IN_QUEUE')).toBe('Este pedido ya fue enviado a barra')
    expect(scanRejectionMessage('DELIVERED')).toBe('Este pedido ya fue entregado')
    expect(scanRejectionMessage('IN_VERIFICATION')).toBe('Este pedido aún no está pagado')
    expect(scanRejectionMessage('EXPIRED')).toBe('Este pedido no es válido')
  })
})
