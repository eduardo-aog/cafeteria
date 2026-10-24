export type Perm = 'cashier' | 'barista' | 'manager' | 'admin'

// Respuesta de GET /me. Los permisos ya vienen efectivos: manager incluye al administrador.
export interface Me {
  id: string
  name: string
  email: string
  permissions: Record<Perm, boolean>
  isStaff: boolean
  pointsBalance: number
}

export type Category = 'CAFE' | 'BEBIDAS' | 'POSTRES'

export const CATEGORY_LABELS: Record<Category, string> = {
  CAFE: 'Café',
  BEBIDAS: 'Bebidas',
  POSTRES: 'Postres',
}

export interface Product {
  id: string
  name: string
  description: string
  priceCents: number
  // null mientras no haya tasa BCV: solo se muestran dólares.
  priceBsCents: number | null
  imageUrl: string | null
  category: Category
  isAvailable: boolean
  isActive: boolean
}

export interface BcvRateInfo {
  rateHundredths: number
  bcvDate: string // YYYY-MM-DD
}

export interface StoreInfo {
  isOpen: boolean
  openDays: number[]
  openTime: string
  closeTime: string
  nextOpening: string | null
}

export interface MenuResponse {
  products: Product[]
  rate: BcvRateInfo | null
  limits: { maxQuantityPerProduct: number }
  store: StoreInfo
}

export type OrderStatus =
  'CREATED' | 'IN_VERIFICATION' | 'PAID' | 'IN_QUEUE' | 'DELIVERED' | 'EXPIRED' | 'CANCELLED'

export type RejectReason = 'REFERENCE_NOT_FOUND' | 'WRONG_AMOUNT' | 'OTHER'

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  REFERENCE_NOT_FOUND: 'Referencia no encontrada',
  WRONG_AMOUNT: 'Monto incorrecto',
  OTHER: 'Otro',
}

export interface CheckoutItem {
  id: string
  productId: string
  name: string
  category: Category
  imageUrl: string | null
  isAvailable: boolean
  isActive: boolean
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  lineTotalBsCents: number | null
}

export interface Checkout {
  id: string
  status: OrderStatus
  // Checkout abierto: CREATED sin envío de referencia previo.
  isOpen: boolean
  expiresAt: string | null
  expiredAt: string | null
  blockedUntil: string | null
  lastRejection: { reason: RejectReason | null; note: string | null; at: string | null } | null
  items: CheckoutItem[]
  totalCents: number
  totalBsCents: number | null
}

export interface CheckoutsResponse {
  checkouts: Checkout[]
  maxQuantityPerProduct: number
}
