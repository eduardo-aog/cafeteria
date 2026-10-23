import { describe, expect, it } from 'vitest'
import {
  effectivePermissions,
  hasAnyPerm,
  hasPerm,
  isStaff,
  type PermissionFlags,
} from './permissions.js'

const none: PermissionFlags = {
  isAdmin: false,
  canCashier: false,
  canBarista: false,
  canManager: false,
}

describe('permissions', () => {
  it('un cliente no tiene permisos y no es cuenta de trabajo', () => {
    expect(isStaff(none)).toBe(false)
    expect(effectivePermissions(none)).toEqual({
      cashier: false,
      barista: false,
      manager: false,
      admin: false,
    })
  })

  it('cualquier permiso convierte la cuenta en de trabajo', () => {
    expect(isStaff({ ...none, canCashier: true })).toBe(true)
    expect(isStaff({ ...none, canBarista: true })).toBe(true)
    expect(isStaff({ ...none, canManager: true })).toBe(true)
    expect(isStaff({ ...none, isAdmin: true })).toBe(true)
  })

  it('el permiso de gerente se cumple con canManager o isAdmin', () => {
    expect(hasPerm({ ...none, canManager: true }, 'manager')).toBe(true)
    expect(hasPerm({ ...none, isAdmin: true }, 'manager')).toBe(true)
    expect(hasPerm({ ...none, canCashier: true }, 'manager')).toBe(false)
  })

  it('el administrador no hereda cajero ni barista', () => {
    const admin = { ...none, isAdmin: true }
    expect(hasPerm(admin, 'cashier')).toBe(false)
    expect(hasPerm(admin, 'barista')).toBe(false)
    expect(hasPerm({ ...admin, canCashier: true }, 'cashier')).toBe(true)
  })

  it('gerente no es administrador', () => {
    expect(hasPerm({ ...none, canManager: true }, 'admin')).toBe(false)
  })

  it('hasAnyPerm acepta cualquiera de la lista', () => {
    const manager = { ...none, canManager: true }
    expect(hasAnyPerm(manager, ['barista', 'manager', 'admin'])).toBe(true)
    expect(hasAnyPerm({ ...none, canCashier: true }, ['barista', 'manager', 'admin'])).toBe(false)
  })
})
