// Reglas puras del checkout (8.5).

// El plazo se reinicia al agregar un ítem y al volver a CREATED tras un rechazo.
export function checkoutExpiry(now: Date, expirationHours: number): Date {
  return new Date(now.getTime() + expirationHours * 60 * 60 * 1000)
}

// El tope es por producto y suma todas las líneas del checkout, con o sin cupón.
export function exceedsProductLimit(currentUnits: number, adding: number, max: number): boolean {
  return currentUnits + adding > max
}
