import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { InventoryOrder } from '@/lib/types'

// Inventario del cliente: el detalle del pedido se refresca cada 10 s (10.5).
export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => api<{ orders: InventoryOrder[] }>('/orders/inventory'),
    refetchInterval: 10_000,
  })
}
