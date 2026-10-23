import {
  BookOpen,
  ChartColumn,
  ChefHat,
  ClipboardCheck,
  Gift,
  ScanLine,
  Settings,
  TrendingUp,
  Undo2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Perm } from '@/lib/types'

export interface StaffSection {
  path: string
  label: string
  icon: LucideIcon
  // Basta con tener alguno de estos permisos (10.4).
  perms: Perm[]
}

export const STAFF_SECTIONS: StaffSection[] = [
  { path: 'verificacion', label: 'Cola de verificación', icon: ClipboardCheck, perms: ['cashier'] },
  { path: 'escanear', label: 'Escanear pedido', icon: ScanLine, perms: ['cashier'] },
  { path: 'barra', label: 'Cola de barra', icon: ChefHat, perms: ['barista', 'manager'] },
  { path: 'catalogo', label: 'Catálogo', icon: BookOpen, perms: ['manager'] },
  { path: 'ventas-hoy', label: 'Ventas de hoy', icon: TrendingUp, perms: ['manager'] },
  { path: 'restaurar', label: 'Restaurar pedidos', icon: Undo2, perms: ['manager'] },
  { path: 'recompensas', label: 'Recompensas', icon: Gift, perms: ['admin'] },
  { path: 'permisos', label: 'Permisos', icon: Users, perms: ['admin'] },
  { path: 'configuracion', label: 'Configuración', icon: Settings, perms: ['admin'] },
  { path: 'reportes', label: 'Reportes', icon: ChartColumn, perms: ['admin'] },
]
