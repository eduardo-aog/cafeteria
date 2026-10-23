import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Me } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'

export function useMe() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: ['me', userId],
    queryFn: () => api<Me>('/me'),
    enabled: !!userId,
  })
}
