export type Perm = 'cashier' | 'barista' | 'manager' | 'admin'

export interface PermissionFlags {
  isAdmin: boolean
  canCashier: boolean
  canBarista: boolean
  canManager: boolean
}

// El gerente se cumple con canManager o isAdmin (8.1). Cajero y barista no se heredan del administrador.
export function hasPerm(user: PermissionFlags, perm: Perm): boolean {
  switch (perm) {
    case 'admin':
      return user.isAdmin
    case 'manager':
      return user.canManager || user.isAdmin
    case 'cashier':
      return user.canCashier
    case 'barista':
      return user.canBarista
  }
}

export function hasAnyPerm(user: PermissionFlags, perms: Perm[]): boolean {
  return perms.some((perm) => hasPerm(user, perm))
}

// Cuenta de trabajo: al menos un permiso o isAdmin. No puede comprar ni acumular puntos.
export function isStaff(user: PermissionFlags): boolean {
  return user.isAdmin || user.canCashier || user.canBarista || user.canManager
}

export function effectivePermissions(user: PermissionFlags): Record<Perm, boolean> {
  return {
    cashier: hasPerm(user, 'cashier'),
    barista: hasPerm(user, 'barista'),
    manager: hasPerm(user, 'manager'),
    admin: hasPerm(user, 'admin'),
  }
}
