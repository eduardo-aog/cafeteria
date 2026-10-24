import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { HistoryOrder } from '@/lib/types'

interface HistoryPage {
  orders: HistoryOrder[]
  nextCursor: string | null
}

// Historial del cliente, de 20 en 20 (8.7).
export function useHistory() {
  return useInfiniteQuery({
    queryKey: ['history'],
    queryFn: ({ pageParam }) =>
      api<HistoryPage>(`/orders/history${pageParam ? `?cursor=${pageParam}` : ''}`),
    initialPageParam: '',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}
