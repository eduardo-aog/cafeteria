import { Link } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRedeem, useRewards } from '@/hooks/useRewards'
import { formatDate } from '@/lib/format'
import { describeDaysLeft, describeReward } from '@/lib/rewards'
import type { ExpiryPreview, Reward } from '@/lib/types'

// Catálogo de recompensas activas con su costo; «Canjear» se deshabilita si no alcanza el saldo (8.9).
export default function RewardsPage() {
  const rewards = useRewards()

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/puntos"
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-primary"
      >
        <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
        Volver a puntos
      </Link>
      <h1 className="text-2xl">Recompensas</h1>

      {rewards.isPending && <LoadingBlock />}
      {rewards.isError && (
        <ErrorBlock message={rewards.error.message} onRetry={() => void rewards.refetch()} />
      )}
      {rewards.data && (
        <>
          <Card>
            <CardContent className="flex items-center gap-3">
              <Star className="size-6 text-caramel" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <p className="text-sm text-muted-foreground">Tu saldo</p>
                <p className="text-xl font-semibold">{rewards.data.balance} puntos</p>
              </div>
            </CardContent>
          </Card>
          {rewards.data.rewards.length === 0 && (
            <EmptyBlock>Por ahora no hay recompensas disponibles.</EmptyBlock>
          )}
          <ul className="flex flex-col gap-3">
            {rewards.data.rewards.map((reward) => (
              <li key={reward.id}>
                <RewardCard
                  reward={reward}
                  balance={rewards.data.balance}
                  expiry={rewards.data.expiry}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function RewardCard({
  reward,
  balance,
  expiry,
}: {
  reward: Reward
  balance: number
  expiry: ExpiryPreview
}) {
  const redeem = useRedeem()
  const missing = reward.costPoints - balance

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <h2 className="font-sans text-base font-semibold">{reward.name}</h2>
          <p className="text-sm text-muted-foreground">{describeReward(reward)}</p>
        </div>
        <p className="font-semibold text-caramel">{reward.costPoints} puntos</p>

        <ConfirmDialog
          trigger={
            <Button disabled={missing > 0 || redeem.isPending}>
              {missing > 0 ? `Te faltan ${missing} puntos` : 'Canjear'}
            </Button>
          }
          title={`¿Canjear «${reward.name}»?`}
          description={`Se descontarán ${reward.costPoints} puntos de tu saldo. El canje es definitivo y no se puede deshacer.`}
          confirmLabel="Canjear"
          onConfirm={() =>
            redeem.mutate(reward.id, {
              onSuccess: () => toast.success('Cupón canjeado. Lo encuentras en «Mis cupones».'),
            })
          }
        >
          <ExpiryNotice expiry={expiry} />
        </ConfirmDialog>
      </CardContent>
    </Card>
  )
}

// Fecha de vencimiento y días que quedan; con menos de 5 días el aviso es más fuerte (8.9).
function ExpiryNotice({ expiry }: { expiry: ExpiryPreview }) {
  const text = `El cupón vence el ${formatDate(expiry.expiresAt)} (${describeDaysLeft(expiry.daysLeft)}).`
  return expiry.isExpiringSoon ? (
    <p className="rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning" role="alert">
      ¡Atención! {text} Úsalo pronto.
    </p>
  ) : (
    <p className="text-sm text-muted-foreground">{text}</p>
  )
}
