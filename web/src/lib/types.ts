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
  discountCents: number
  couponTitle: string | null
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

export interface Bank {
  code: string
  name: string
}

// Respuesta de POST /checkouts/:id/prepare-payment (8.6, paso 1).
export interface PreparedPayment {
  isFree: boolean
  totalCents: number
  totalBsCents: number
  rateHundredths: number | null
  payment: {
    bank: string
    document: string
    phone: string
    amountBsCents: number
    clipboardText: string
  } | null
}

// Línea afectada en un ITEMS_UNAVAILABLE.
export interface UnavailableItem {
  itemId: string
  name: string
  reason: 'SOLD_OUT' | 'DISCONTINUED'
}

export interface VerificationSubmission {
  id: string
  submittedAt: string
  customerName: string
  reference: string
  bankCode: string
  bankName: string
  totalCents: number
  amountBsCents: number
  items: {
    id: string
    name: string
    quantity: number
    lineTotalCents: number | null
    couponTitle: string | null
  }[]
}

export interface InventoryOrder {
  id: string
  paidAt: string
  pickupCode: string | null
  qrToken: string | null
  totalCents: number
  amountBsCents: number
  pointsEarned: number | null
  items: {
    id: string
    name: string
    quantity: number
    unitPriceCents: number
    discountCents: number
    lineTotalCents: number
    couponTitle: string | null
  }[]
}

// Pedido en la cola del barista o en la lista de entregados de hoy.
export interface QueueOrder {
  id: string
  pickupCode: string | null
  customerName: string
  scannedAt: string | null
  deliveredAt: string | null
  items: { id: string; name: string; quantity: number }[]
}

// Respuesta de POST /cashier/scan.
export interface ScanResult {
  pickupCode: string | null
  customerName: string
  items: { id: string; name: string; quantity: number }[]
}

export interface HistoryOrder {
  id: string
  paidAt: string | null
  scannedAt: string | null
  totalCents: number | null
  amountBsCents: number | null
  items: {
    id: string
    name: string
    quantity: number
    lineTotalCents: number | null
    couponTitle: string | null
  }[]
}

export type RewardType = 'PERCENT_DISCOUNT' | 'FREE_PRODUCT'

export interface Reward {
  id: string
  name: string
  type: RewardType
  percent: number | null
  productId: string | null
  productName: string | null
  costPoints: number
  isActive: boolean
}

// Cuándo vencería un cupón canjeado hoy (lo calcula el servidor, 8.9).
export interface ExpiryPreview {
  expiresAt: string
  daysLeft: number
  isExpiringSoon: boolean
}

export interface RewardsResponse {
  balance: number
  expiry: ExpiryPreview
  rewards: Reward[]
}

export type CouponStatus = 'AVAILABLE' | 'RESERVED' | 'USED' | 'EXPIRED'

export interface Coupon {
  id: string
  title: string
  type: RewardType
  percent: number | null
  productId: string | null
  productName: string | null
  status: CouponStatus
  expiresAt: string
  usedAt: string | null
  daysLeft: number
  isUsable: boolean
}

export interface PointsMovement {
  id: string
  type: 'EARN' | 'REDEEM'
  points: number
  createdAt: string
  couponTitle: string | null
}

export interface AdminSettings {
  pointsPerDollar: number
  checkoutExpirationHours: number
  maxPaidUnscannedOrders: number
  rejectionsBeforeBlock: number
  blockMinutes: number
  referenceSubmissionsPerMinute: number
  maxQuantityPerProduct: number
  paymentDocType: 'V' | 'E' | 'J' | 'G'
  paymentDocNumber: string
  paymentBankCode: string
  paymentPhone: string
  openDays: number[]
  openTime: string
  closeTime: string
}

export interface StaffUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  canCashier: boolean
  canBarista: boolean
  canManager: boolean
  isStaff: boolean
}

export type ReportPeriod = 'today' | 'week' | 'month' | 'custom'

export interface SalesReport {
  period: { key: ReportPeriod; start: string; end: string }
  totals: { orders: number; totalCents: number; totalBsCents: number }
  byProduct: {
    productId: string
    name: string
    category: Category
    units: number
    amountCents: number
  }[]
  byCategory: { category: Category; units: number; amountCents: number }[]
  topProducts: {
    productId: string
    name: string
    category: Category
    units: number
    amountCents: number
  }[]
  demandByHour: number[]
  demandByWeekday: number[]
}

export interface SalesToday {
  totals: { orders: number; totalCents: number; totalBsCents: number }
  units: { productId: string; name: string; units: number }[]
}
