import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { QueueOrder } from '@/lib/types'

const QUEUE_KEY = ['barista-queue']
const DELIVERED_KEY = ['delivered-today']

type OrdersCache = { orders: QueueOrder[] } | undefined

// La cola de barra se refresca cada 5 s (10.5).
export function useBaristaQueue() {
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: () => api<{ orders: QueueOrder[] }>('/barista/queue'),
    refetchInterval: 5_000,
  })
}

export function useDeliveredToday() {
  return useQuery({
    queryKey: DELIVERED_KEY,
    queryFn: () => api<{ orders: QueueOrder[] }>('/manager/delivered-today'),
  })
}

// El pedido sale de su lista al instante y vuelve si el servidor lo rechaza.
function useMoveOrder(request: (id: string) => Promise<unknown>, listKey: readonly string[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<OrdersCache>(listKey)
      queryClient.setQueryData<OrdersCache>(
        listKey,
        (old) => old && { orders: old.orders.filter((o) => o.id !== id) },
      )
      return { previous }
    },
    onSuccess: () => {
      // La otra lista cambió: se vuelve a pedir si está abierta.
      void queryClient.invalidateQueries({ queryKey: QUEUE_KEY })
      void queryClient.invalidateQueries({ queryKey: DELIVERED_KEY })
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      toast.error(err.message)
      void queryClient.invalidateQueries({ queryKey: listKey })
    },
  })
}

export function useDeliver() {
  return useMoveOrder((id) => api(`/barista/orders/${id}/deliver`, { method: 'POST' }), QUEUE_KEY)
}

export function useRestore() {
  return useMoveOrder(
    (id) => api(`/manager/orders/${id}/restore`, { method: 'POST' }),
    DELIVERED_KEY,
  )
}
