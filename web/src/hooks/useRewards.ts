import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Coupon, PointsMovement, RewardsResponse } from '@/lib/types'

export function useRewards() {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: () => api<RewardsResponse>('/rewards'),
  })
}

// El canje es definitivo (8.9). Cambia el saldo, los cupones y los movimientos.
export function useRedeem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: string) =>
      api<{ coupon: Coupon }>(`/rewards/${rewardId}/redeem`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
      void queryClient.invalidateQueries({ queryKey: ['coupons'] })
      void queryClient.invalidateQueries({ queryKey: ['points'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => {
      toast.error(err.message)
      void queryClient.invalidateQueries({ queryKey: ['rewards'] })
    },
  })
}

export type CouponTab = 'available' | 'used' | 'expired'

export function useCoupons(tab: CouponTab) {
  return useQuery({
    queryKey: ['coupons', tab],
    queryFn: () => api<{ coupons: Coupon[] }>(`/coupons?status=${tab}`),
  })
}

// Cupones aplicables a un producto (8.9).
export function useProductCoupons(productId: string | undefined) {
  return useQuery({
    queryKey: ['coupons', 'product', productId],
    queryFn: () => api<{ coupons: Coupon[] }>(`/products/${productId}/coupons`),
    enabled: !!productId,
  })
}

interface PointsPage {
  balance: number
  movements: PointsMovement[]
  nextCursor: string | null
}

export function usePoints() {
  return useInfiniteQuery({
    queryKey: ['points'],
    queryFn: ({ pageParam }) =>
      api<PointsPage>(`/points${pageParam ? `?cursor=${pageParam}` : ''}`),
    initialPageParam: '',
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}
