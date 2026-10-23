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
