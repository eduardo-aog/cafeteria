// Dinero en enteros (6.1): dólares en centavos y tasa BCV en centésimas de bolívar.

// bsCents = round(usdCents * rateHundredths / 100). Ej.: 400 * 88623 / 100 = 354492.
export function usdToBsCents(usdCents: number, rateHundredths: number): number {
  return Math.round((usdCents * rateHundredths) / 100)
}

// Formato venezolano: punto para miles y coma para decimales. No se usa Intl (varía entre navegadores).
function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.round(cents))
  const units = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}${units},${String(abs % 100).padStart(2, '0')}`
}

export function formatUsd(cents: number): string {
  const text = formatCents(cents)
  return text.startsWith('-') ? `-$${text.slice(1)}` : `$${text}`
}

export function formatBs(cents: number): string {
  return `Bs ${formatCents(cents)}`
}

// Descuento porcentual por unidad, redondeado al centavo más cercano.
export function percentDiscount(unitPriceCents: number, percent: number): number {
  return Math.round((unitPriceCents * percent) / 100)
}

// Total de una línea: nunca menor que 0.
export function lineTotal(unitPriceCents: number, discountCents: number): number {
  return Math.max(0, unitPriceCents - discountCents)
}
