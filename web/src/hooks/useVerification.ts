import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { RejectReason, VerificationSubmission } from '@/lib/types'

const KEY = ['verification-queue']

type Queue = { submissions: VerificationSubmission[] } | undefined

// La cola de verificación se refresca cada 5 s (10.5).
export function useVerificationQueue() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ submissions: VerificationSubmission[] }>('/cashier/verification-queue'),
    refetchInterval: 5_000,
  })
}

// Aprobar o rechazar: el envío sale de la cola al instante y vuelve si el servidor lo rechaza
// (por ejemplo, «Ya verificado por …» cuando otro cajero llegó primero).
function useReview<TVars extends { id: string }>(request: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: KEY })
      const previous = queryClient.getQueryData<Queue>(KEY)
      queryClient.setQueryData<Queue>(
        KEY,
        (old) => old && { submissions: old.submissions.filter((s) => s.id !== id) },
      )
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous)
      toast.error(err.message)
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useApprove() {
  return useReview(({ id }: { id: string }) =>
    api(`/cashier/submissions/${id}/approve`, { method: 'POST' }),
  )
}

export function useReject() {
  return useReview(({ id, reason, note }: { id: string; reason: RejectReason; note?: string }) =>
    api(`/cashier/submissions/${id}/reject`, { method: 'POST', body: { reason, note } }),
  )
}
