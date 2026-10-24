import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminRewards, useSetRewardActive } from '@/hooks/useAdminRewards'
import { describeReward } from '@/lib/rewards'
import type { Reward } from '@/lib/types'

// Gestión de recompensas (administrador): se crean, editan y activan o desactivan; no se borran (8.9).
export default function AdminRewardsPage() {
  const rewards = useAdminRewards()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">Recompensas</h1>
        <Button asChild>
          <Link to="/trabajo/recompensas/nueva">
            <Plus strokeWidth={1.5} aria-hidden="true" />
            Nueva
          </Link>
        </Button>
      </div>
      {rewards.isPending && <LoadingBlock />}
      {rewards.isError && (
        <ErrorBlock message={rewards.error.message} onRetry={() => void rewards.refetch()} />
      )}
      {rewards.data && rewards.data.rewards.length === 0 && (
        <EmptyBlock>Todavía no hay recompensas. Crea la primera con «Nueva».</EmptyBlock>
      )}
      {rewards.data?.rewards.map((reward) => (
        <RewardRow key={reward.id} reward={reward} />
      ))}
    </div>
  )
}

function RewardRow({ reward }: { reward: Reward }) {
  const setActive = useSetRewardActive()

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-base font-semibold">{reward.name}</h2>
          {!reward.isActive && <StatusBadge tone="expired">Inactiva</StatusBadge>}
        </div>
        <p className="text-sm text-muted-foreground">{describeReward(reward)}</p>
        <p className="font-semibold text-caramel">{reward.costPoints} puntos</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" asChild>
            <Link to={`/trabajo/recompensas/${reward.id}`}>Editar</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setActive.mutate(
                { id: reward.id, isActive: !reward.isActive },
                {
                  onSuccess: () =>
                    toast.success(
                      reward.isActive ? 'Recompensa desactivada.' : 'Recompensa activada.',
                    ),
                },
              )
            }
          >
            {reward.isActive ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
