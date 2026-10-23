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
  store: StoreInfo
}
