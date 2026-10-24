import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Checkout, CheckoutsResponse } from '@/lib/types'

const KEY = ['checkouts']

// Las mutaciones de checkout llevan esta clave: useIsMutating({ mutationKey: MUTATION_KEY }) detecta si hay alguna en curso.
export const CHECKOUT_MUTATION_KEY = ['checkout']

// El checkout se refresca cada 10 s (10.5).
export function useCheckouts() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<CheckoutsResponse>('/checkouts'),
    refetchInterval: 10_000,
  })
}

type CheckoutResponse = { checkout: Checkout | null }
type Cache = CheckoutsResponse | undefined

// Si la lista aún no se ha cargado (por ejemplo, se agregó desde el menú) no se inventa: la pantalla de
// checkout la pedirá completa al abrirse.
function upsertCheckout(old: Cache, checkout: Checkout): Cache {
  if (!old) return old
  const exists = old.checkouts.some((c) => c.id === checkout.id)
  return {
    ...old,
    checkouts: exists
      ? old.checkouts.map((c) => (c.id === checkout.id ? checkout : c))
      : [checkout, ...old.checkouts],
  }
}

function removeCheckout(old: Cache, checkoutId: string): Cache {
  return old && { ...old, checkouts: old.checkouts.filter((c) => c.id !== checkoutId) }
}

// El servidor responde con el checkout ya actualizado: se escribe en la caché y no hace falta volver a pedir la lista.
function useCheckoutMutation<TVars, TResult>({
  request,
  optimistic,
  apply,
}: {
  request: (vars: TVars) => Promise<TResult>
  // Cambio inmediato en pantalla, solo de lo que no lleva montos (cantidad de un selector, quitar, cancelar).
  optimistic?: (old: Cache, vars: TVars) => Cache
  apply: (queryClient: QueryClient, data: TResult, vars: TVars) => void
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: CHECKOUT_MUTATION_KEY,
    mutationFn: request,
    onMutate: async (vars) => {
      if (!optimistic) return undefined
      await queryClient.cancelQueries({ queryKey: KEY })
      const previous = queryClient.getQueryData<CheckoutsResponse>(KEY)
      queryClient.setQueryData<CheckoutsResponse>(KEY, (old) => optimistic(old, vars))
      return { previous }
    },
    onSuccess: async (data, vars) => {
      await queryClient.cancelQueries({ queryKey: KEY })
      apply(queryClient, data, vars)
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous)
      toast.error(err.message)
      // El cambio falló: se vuelve a pedir la lista para quedar igual que el servidor.
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

function applyCheckoutResponse(queryClient: QueryClient, data: CheckoutResponse) {
  if (data.checkout) {
    const checkout = data.checkout
    queryClient.setQueryData<CheckoutsResponse>(KEY, (old) => upsertCheckout(old, checkout))
  } else {
    // Se quitó la última línea: el checkout quedó cancelado y deja de mostrarse.
    void queryClient.invalidateQueries({ queryKey: KEY })
  }
}

export function useUpdateItem() {
  return useCheckoutMutation({
    request: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api<CheckoutResponse>(`/checkout/items/${itemId}`, { method: 'PATCH', body: { quantity } }),
    optimistic: (old, { itemId, quantity }) =>
      old && {
        ...old,
        checkouts: old.checkouts.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        })),
      },
    apply: (queryClient, data) => applyCheckoutResponse(queryClient, data),
  })
}

export function useRemoveItem() {
  return useCheckoutMutation({
    request: (itemId: string) =>
      api<CheckoutResponse>(`/checkout/items/${itemId}`, { method: 'DELETE' }),
    optimistic: (old, itemId) =>
      old && {
        ...old,
        checkouts: old.checkouts
          .map((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) }))
          .filter((c) => c.items.length > 0),
      },
    apply: (queryClient, data) => applyCheckoutResponse(queryClient, data),
  })
}

export function useCancelCheckout() {
  return useCheckoutMutation({
    request: (checkoutId: string) =>
      api<{ ok: true }>(`/checkouts/${checkoutId}/cancel`, { method: 'POST' }),
    optimistic: (old, checkoutId) => removeCheckout(old, checkoutId),
    apply: () => undefined,
  })
}

// Agregar desde el menú o el detalle de producto, con aviso y acceso directo al checkout.
// No es optimista: puede rechazarse (local cerrado, agotado, tope), así que el aviso espera al servidor.
export function useAddToCheckout() {
  const navigate = useNavigate()
  const mutation = useCheckoutMutation({
    request: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api<CheckoutResponse>('/checkout/items', { method: 'POST', body: { productId, quantity } }),
    apply: (queryClient, data) => applyCheckoutResponse(queryClient, data),
  })
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
