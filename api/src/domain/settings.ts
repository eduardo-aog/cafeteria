import { z } from 'zod'

const int = (min: number, max: number) => z.number().int().min(min).max(max)
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm.')

// Todos los parámetros que edita el administrador (8.11), con rangos razonables.
export const settingsFields = z.object({
  pointsPerDollar: int(1, 10_000),
  checkoutExpirationHours: int(1, 720),
  maxPaidUnscannedOrders: int(1, 100),
  rejectionsBeforeBlock: int(1, 20),
  blockMinutes: int(1, 1440),
  referenceSubmissionsPerMinute: int(1, 60),
  // El tope real de la base de datos para una línea es 100 (CHECK de OrderItem.quantity).
  maxQuantityPerProduct: int(1, 100),
  paymentDocType: z.enum(['V', 'E', 'J', 'G']),
  paymentDocNumber: z.string().regex(/^\d+$/, 'Solo dígitos.'),
  paymentBankCode: z.string().regex(/^\d{4}$/, 'Elige un banco de la lista.'),
  paymentPhone: z.string().regex(/^04\d{9}$/, 'El teléfono debe ser 04XXXXXXXXX (11 dígitos).'),
  openDays: z
    .array(int(1, 7))
    .min(1, 'Elige al menos un día.')
    .refine((days) => new Set(days).size === days.length, 'Hay días repetidos.'),
  openTime: time,
  closeTime: time,
})

// Cédula (V, E) de 6 a 9 dígitos; RIF (J, G) de 9 dígitos. Y la hora de cierre es posterior a la de apertura.
export const settingsSchema = settingsFields.superRefine((v, ctx) => {
  const isRif = v.paymentDocType === 'J' || v.paymentDocType === 'G'
  const digits = v.paymentDocNumber.length
  if (isRif ? digits !== 9 : digits < 6 || digits > 9) {
    ctx.addIssue({
      code: 'custom',
      path: ['paymentDocNumber'],
      message: isRif ? 'El RIF debe tener 9 dígitos.' : 'La cédula debe tener de 6 a 9 dígitos.',
    })
  }
  if (v.closeTime <= v.openTime) {
    ctx.addIssue({
      code: 'custom',
      path: ['closeTime'],
      message: 'La hora de cierre debe ser posterior a la de apertura.',
    })
  }
})

export const settingsPatchSchema = settingsFields.partial()
export type SettingsValues = z.infer<typeof settingsFields>
