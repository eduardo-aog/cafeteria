import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BcvRateInfo, MenuResponse, Product } from '@/lib/types'

// El menú se refresca cada 60 s (10.5).
export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: () => api<MenuResponse>('/menu'),
    refetchInterval: 60_000,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api<{ product: Product; rate: BcvRateInfo | null }>(`/products/${id}`),
    enabled: !!id,
  })
}
