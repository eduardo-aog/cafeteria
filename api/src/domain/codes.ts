import { randomInt } from 'node:crypto'

// Sin I, L, O, 0 ni 1 para evitar confusiones al leer o escribir el código (8.7).
export const PICKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const PICKUP_CODE_LENGTH = 6

export function generatePickupCode(): string {
  let code = ''
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) {
    code += PICKUP_CODE_ALPHABET[randomInt(PICKUP_CODE_ALPHABET.length)]
  }
  return code
}

// Referencia de Pago Móvil: solo dígitos, de 6 a 22 (8.6).
export function isValidReference(reference: string): boolean {
  return /^\d{6,22}$/.test(reference)
}
