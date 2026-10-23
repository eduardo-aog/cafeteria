import type { Perm } from '@/lib/types'
import { useMe } from '@/hooks/useMe'

// La web solo decide qué mostrar; el servidor valida cada acción.
export function usePermissions() {
  const { data: me } = useMe()
  const has = (perm: Perm) => me?.permissions[perm] ?? false
  const hasAny = (perms: Perm[]) => perms.some(has)
  return { has, hasAny }
}
