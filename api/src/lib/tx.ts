// Esperas de las transacciones interactivas de Prisma. Con connection_limit=1 las peticiones simultáneas
// esperan su turno y cada viaje a la base puede tardar (red lenta): los valores por defecto (2 s y 5 s) se quedan cortos.
export const TX_OPTIONS = { maxWait: 15_000, timeout: 30_000 } as const
