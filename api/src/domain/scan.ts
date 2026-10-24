const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PICKUP_CODE = /^[A-Za-z0-9]{6}$/

export type ScanTarget = { kind: 'qr'; value: string } | { kind: 'code'; value: string } | null

// El texto escaneado o escrito es el contenido del QR (un UUID) o el código corto, sin distinguir mayúsculas (8.7).
export function classifyScanCode(raw: string): ScanTarget {
  const text = raw.trim()
  if (UUID.test(text)) return { kind: 'qr', value: text.toLowerCase() }
  if (PICKUP_CODE.test(text)) return { kind: 'code', value: text.toUpperCase() }
  return null
}

// Mensaje cuando el pedido existe pero no está en estado PAID.
export function scanRejectionMessage(status: string): string {
  switch (status) {
    case 'IN_QUEUE':
      return 'Este pedido ya fue enviado a barra'
    case 'DELIVERED':
      return 'Este pedido ya fue entregado'
    case 'CREATED':
    case 'IN_VERIFICATION':
      return 'Este pedido aún no está pagado'
    default:
      return 'Este pedido no es válido'
  }
}
