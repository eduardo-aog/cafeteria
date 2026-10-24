import { describe, expect, it } from 'vitest'
import { settingsPatchSchema, settingsSchema } from './settings.js'

const valid = {
  pointsPerDollar: 100,
  checkoutExpirationHours: 24,
  maxPaidUnscannedOrders: 10,
  rejectionsBeforeBlock: 3,
  blockMinutes: 15,
  referenceSubmissionsPerMinute: 5,
  maxQuantityPerProduct: 10,
  paymentDocType: 'J',
  paymentDocNumber: '123456789',
  paymentBankCode: '0134',
  paymentPhone: '04141234567',
  openDays: [1, 2, 3, 4, 5, 6],
  openTime: '08:00',
  closeTime: '20:00',
}

const issues = (value: unknown) =>
  settingsSchema.safeParse(value).error?.issues.map((i) => i.path.join('.')) ?? []

describe('settingsSchema', () => {
  it('acepta los valores por defecto', () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true)
  })

  it('los números deben ser enteros dentro de un rango razonable', () => {
    expect(issues({ ...valid, maxQuantityPerProduct: 0 })).toContain('maxQuantityPerProduct')
    expect(issues({ ...valid, maxQuantityPerProduct: 101 })).toContain('maxQuantityPerProduct')
    expect(issues({ ...valid, pointsPerDollar: 1.5 })).toContain('pointsPerDollar')
    expect(issues({ ...valid, blockMinutes: -1 })).toContain('blockMinutes')
    expect(settingsSchema.safeParse({ ...valid, maxQuantityPerProduct: 5 }).success).toBe(true)
  })

  it('el RIF (J y G) tiene 9 dígitos y la cédula (V y E), de 6 a 9', () => {
    expect(issues({ ...valid, paymentDocNumber: '12345678' })).toContain('paymentDocNumber')
    expect(
      settingsSchema.safeParse({ ...valid, paymentDocType: 'V', paymentDocNumber: '12345678' })
        .success,
    ).toBe(true)
    expect(issues({ ...valid, paymentDocType: 'V', paymentDocNumber: '12345' })).toContain(
      'paymentDocNumber',
    )
    expect(issues({ ...valid, paymentDocType: 'E', paymentDocNumber: '1234567890' })).toContain(
      'paymentDocNumber',
    )
    expect(issues({ ...valid, paymentDocType: 'X' })).toContain('paymentDocType')
  })

  it('el teléfono es 04XXXXXXXXX', () => {
    expect(issues({ ...valid, paymentPhone: '4141234567' })).toContain('paymentPhone')
    expect(issues({ ...valid, paymentPhone: '0414123456' })).toContain('paymentPhone')
    expect(issues({ ...valid, paymentPhone: '04141234567' })).not.toContain('paymentPhone')
  })

  it('el horario: formato HH:mm, cierre posterior a la apertura y al menos un día', () => {
    expect(issues({ ...valid, openTime: '8:00' })).toContain('openTime')
    expect(issues({ ...valid, openTime: '25:00' })).toContain('openTime')
    expect(issues({ ...valid, openTime: '20:00', closeTime: '08:00' })).toContain('closeTime')
    expect(issues({ ...valid, closeTime: '08:00' })).toContain('closeTime')
    expect(issues({ ...valid, openDays: [] })).toContain('openDays')
    expect(issues({ ...valid, openDays: [1, 1] })).toContain('openDays')
    expect(issues({ ...valid, openDays: [0, 8] })).toContain('openDays.0')
    expect(
      settingsSchema.safeParse({
        ...valid,
        openTime: '00:00',
        closeTime: '23:59',
        openDays: [1, 2, 3, 4, 5, 6, 7],
      }).success,
    ).toBe(true)
  })
})

describe('settingsPatchSchema', () => {
  it('acepta un subconjunto de campos', () => {
    expect(settingsPatchSchema.safeParse({ maxQuantityPerProduct: 5 }).success).toBe(true)
    expect(settingsPatchSchema.safeParse({ maxQuantityPerProduct: 'cinco' }).success).toBe(false)
  })
})
