import { formatBs } from './money.js'

export type PaymentDocType = 'V' | 'E' | 'J' | 'G'

// Documento de cobro (8.6): cédula `V-12345678` y RIF `J-12345678-9` (9 dígitos, el último es el verificador).
export function formatPaymentDoc(type: string, number: string): string {
  if ((type === 'J' || type === 'G') && /^\d{9}$/.test(number)) {
    return `${type}-${number.slice(0, 8)}-${number.slice(8)}`
  }
  return `${type}-${number}`
}

// 04141234567 → 0414-1234567
export function formatPhone(phone: string): string {
  return /^04\d{9}$/.test(phone) ? `${phone.slice(0, 4)}-${phone.slice(4)}` : phone
}

interface PaymentTextInput {
  bankCode: string
  bankName: string
  docType: string
  docNumber: string
  phone: string
  amountBsCents: number
}

// Texto del botón «COPIAR TODO» (8.6).
export function buildPaymentText(input: PaymentTextInput): string {
  return [
    'Pago Móvil',
    `Banco: ${input.bankCode} - ${input.bankName}`,
    `Documento: ${formatPaymentDoc(input.docType, input.docNumber)}`,
    `Teléfono: ${formatPhone(input.phone)}`,
    `Monto: ${formatBs(input.amountBsCents)}`,
  ].join('\n')
}
