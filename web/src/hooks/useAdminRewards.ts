import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Reward, RewardType } from '@/lib/types'

const KEY = ['admin', 'rewards']

type Cache = { rewards: Reward[] } | undefined

export function useAdminRewards() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ rewards: Reward[] }>('/admin/rewards'),
  })
}

export interface RewardInput {
  name: string
  type: RewardType
  percent: number | null
  productId: string | null
  costPoints: number
}

function useRewardMutation<TVars>(
  request: (vars: TVars) => Promise<{ reward: Reward }>,
  optimistic?: (reward: Reward, vars: TVars) => Reward,
  idOf?: (vars: TVars) => string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onMutate: async (vars) => {
      if (!optimistic || !idOf) return undefined
      await queryClient.cancelQueries({ queryKey: KEY })
      const previous = queryClient.getQueryData<Cache>(KEY)
      queryClient.setQueryData<Cache>(
        KEY,
        (old) =>
          old && {
            rewards: old.rewards.map((r) => (r.id === idOf(vars) ? optimistic(r, vars) : r)),
          },
      )
      return { previous }
    },
    onSuccess: ({ reward }) => {
      queryClient.setQueryData<Cache>(
        KEY,
        (old) =>
          old && {
            rewards: old.rewards.some((r) => r.id === reward.id)
              ? old.rewards.map((r) => (r.id === reward.id ? reward : r))
              : [...old.rewards, reward],
          },
      )
      // El catálogo del cliente cambia si está abierto.
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous)
      toast.error(err.message)
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useCreateReward() {
  return useRewardMutation((input: RewardInput) =>
    api<{ reward: Reward }>('/admin/rewards', { method: 'POST', body: input }),
  )
}

export function useUpdateReward() {
  return useRewardMutation(({ id, ...input }: RewardInput & { id: string }) =>
    api<{ reward: Reward }>(`/admin/rewards/${id}`, { method: 'PATCH', body: input }),
  )
}

// Desactivar o activar: cambia al instante en la lista (solo una bandera, sin montos).
export function useSetRewardActive() {
  return useRewardMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      api<{ reward: Reward }>(`/admin/rewards/${id}`, { method: 'PATCH', body: { isActive } }),
    (reward, { isActive }) => ({ ...reward, isActive }),
    (vars) => vars.id,
  )
}
