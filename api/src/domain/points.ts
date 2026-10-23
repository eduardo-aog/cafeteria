// Puntos por lo pagado en dólares tras los cupones, con redondeo hacia abajo (8.8).
export function pointsFor(totalCents: number, pointsPerDollar: number): number {
  return Math.floor((totalCents * pointsPerDollar) / 100)
}
