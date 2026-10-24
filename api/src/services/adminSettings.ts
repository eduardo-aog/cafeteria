import type { Settings } from '@prisma/client'
import { settingsPatchSchema, settingsSchema } from '../domain/settings.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { getBanks } from './banks.js'
import { getSettings, invalidateSettings } from './settings.js'

const toDto = (s: Settings) => ({
  pointsPerDollar: s.pointsPerDollar,
  checkoutExpirationHours: s.checkoutExpirationHours,
  maxPaidUnscannedOrders: s.maxPaidUnscannedOrders,
  rejectionsBeforeBlock: s.rejectionsBeforeBlock,
  blockMinutes: s.blockMinutes,
  referenceSubmissionsPerMinute: s.referenceSubmissionsPerMinute,
  maxQuantityPerProduct: s.maxQuantityPerProduct,
  paymentDocType: s.paymentDocType,
  paymentDocNumber: s.paymentDocNumber,
  paymentBankCode: s.paymentBankCode,
  paymentPhone: s.paymentPhone,
  openDays: s.openDays,
  openTime: s.openTime,
  closeTime: s.closeTime,
})

export async function getAdminSettings() {
  return toDto(await prisma.settings.findUniqueOrThrow({ where: { id: 1 } }))
}

export const settingsPatchInput = settingsPatchSchema

// Los cambios aplican desde ese momento; no se recalculan pedidos existentes (8.11).
export async function updateAdminSettings(patch: ReturnType<typeof settingsPatchSchema.parse>) {
  const current = toDto(await getSettings())
  // Se valida el resultado completo, no solo los campos enviados (por ejemplo, el cierre contra la apertura).
  const merged = settingsSchema.safeParse({ ...current, ...patch })
  if (!merged.success) throw merged.error

  if (!(await getBanks()).some((b) => b.code === merged.data.paymentBankCode)) {
    throw new AppError('INVALID_BANK', 'Elige un banco de la lista.', 400)
  }
  const updated = await prisma.settings.update({ where: { id: 1 }, data: merged.data })
  invalidateSettings()
  return toDto(updated)
}
