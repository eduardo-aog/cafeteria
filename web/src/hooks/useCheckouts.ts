import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Checkout, CheckoutsResponse } from '@/lib/types'

const KEY = ['checkouts']

// El checkout se refresca cada 10 s (10.5).
export function useCheckouts() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<CheckoutsResponse>('/checkouts'),
    refetchInterval: 10_000,
  })
}

// Tras cada acción se invalidan las consultas afectadas (10.5).
function useCheckoutMutation<TVars, TResult>(request: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
    onError: (err) => toast.error(err.message),
  })
}

type CheckoutResponse = { checkout: Checkout | null }

export function useUpdateItem() {
  return useCheckoutMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    api<CheckoutResponse>(`/checkout/items/${itemId}`, { method: 'PATCH', body: { quantity } }),
  )
}

export function useRemoveItem() {
  return useCheckoutMutation((itemId: string) =>
    api<CheckoutResponse>(`/checkout/items/${itemId}`, { method: 'DELETE' }),
  )
}

export function useCancelCheckout() {
  return useCheckoutMutation((checkoutId: string) =>
    api<{ ok: true }>(`/checkouts/${checkoutId}/cancel`, { method: 'POST' }),
  )
}

// Agregar desde el menú o el detalle de producto, con aviso y acceso directo al checkout.
export function useAddToCheckout() {
  const navigate = useNavigate()
  const mutation = useCheckoutMutation(
    ({ productId, quantity }: { productId: string; quantity: number }) =>
      api<CheckoutResponse>('/checkout/items', { method: 'POST', body: { productId, quantity } }),
  )
  return {
    isPending: mutation.isPending,
    add: (product: { id: string; name: string }, quantity = 1) =>
      mutation.mutate(
        { productId: product.id, quantity },
        {
          onSuccess: () =>
            toast.success(`${product.name} agregado al checkout.`, {
              action: { label: 'Ver', onClick: () => navigate('/checkout') },
            }),
        },
      ),
  }
}
