import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Bank, Checkout, CheckoutsResponse, PreparedPayment } from '@/lib/types'

export function useBanks() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: () => api<{ banks: Bank[] }>('/banks'),
    staleTime: 60 * 60_000, // lista fija (8.6.1)
  })
}

// «Pagar»: valida y trae los datos de cobro. Es una consulta (no cambia nada) y no se repite sola.
export function usePreparePayment(checkoutId: string | undefined) {
  return useQuery({
    queryKey: ['prepare-payment', checkoutId],
    queryFn: () =>
      api<PreparedPayment>(`/checkouts/${checkoutId}/prepare-payment`, { method: 'POST' }),
    enabled: !!checkoutId,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useSubmitPayment(checkoutId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { reference: string; bankCode: string }) =>
      api<{ checkout: Checkout }>(`/checkouts/${checkoutId}/payment`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: ({ checkout }) => {
      queryClient.setQueryData<CheckoutsResponse>(
        ['checkouts'],
        (old) =>
          old && {
            ...old,
            checkouts: old.checkouts.map((c) => (c.id === checkout.id ? checkout : c)),
          },
      )
      void queryClient.invalidateQueries({ queryKey: ['checkouts'] })
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useConfirmFree(checkoutId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api<{ ok: true }>(`/checkouts/${checkoutId}/confirm-free`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkouts'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err) => toast.error(err.message),
  })
}
