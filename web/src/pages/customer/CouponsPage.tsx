import { useState } from 'react'
import { BackLink } from '@/components/BackLink'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { useCoupons, type CouponTab } from '@/hooks/useRewards'
import { formatDate } from '@/lib/format'
import { describeCoupon, describeDaysLeft } from '@/lib/rewards'
import type { Coupon } from '@/lib/types'

const TABS: { value: CouponTab; label: string }[] = [
  { value: 'available', label: 'Disponibles' },
  { value: 'used', label: 'Usados' },
  { value: 'expired', label: 'Vencidos' },
]

const EMPTY: Record<CouponTab, string> = {
  available: 'No tienes cupones disponibles. Canjea una recompensa con tus puntos.',
  used: 'Todavía no has usado ningún cupón.',
  expired: 'No tienes cupones vencidos.',
}

// «Mis cupones» en tres pestañas, con su fecha de vencimiento (8.9).
export default function CouponsPage() {
  const [tab, setTab] = useState<CouponTab>('available')
  const coupons = useCoupons(tab)

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/puntos" />
      <h1 className="text-2xl">Mis cupones</h1>
      <SegmentedControl
        label="Estado de los cupones"
        value={tab}
        options={TABS}
        onChange={setTab}
      />

      {coupons.isPending && <LoadingBlock />}
      {coupons.isError && (
        <ErrorBlock message={coupons.error.message} onRetry={() => void coupons.refetch()} />
      )}
      {coupons.data && coupons.data.coupons.length === 0 && <EmptyBlock>{EMPTY[tab]}</EmptyBlock>}
      {coupons.data?.coupons.map((coupon) => (
        <CouponCard key={coupon.id} coupon={coupon} tab={tab} />
      ))}
    </div>
  )
}

function CouponCard({ coupon, tab }: { coupon: Coupon; tab: CouponTab }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-sans text-base font-semibold">{coupon.title}</h2>
          {coupon.status === 'RESERVED' && (
            <StatusBadge tone="verifying">En tu checkout</StatusBadge>
          )}
          {coupon.status === 'AVAILABLE' && !coupon.isUsable && (
            <StatusBadge tone="expired">No disponible</StatusBadge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{describeCoupon(coupon)}</p>
        {tab === 'available' && (
          <p className="text-sm">
            Vence el {formatDate(coupon.expiresAt)} ({describeDaysLeft(coupon.daysLeft)})
          </p>
        )}
        {tab === 'used' && coupon.usedAt && (
          <p className="text-sm">Usado el {formatDate(coupon.usedAt)}</p>
        )}
        {tab === 'expired' && <p className="text-sm">Venció el {formatDate(coupon.expiresAt)}</p>}
        {coupon.status === 'AVAILABLE' && !coupon.isUsable && (
          <p className="text-sm text-muted-foreground">
            Su producto ya no está disponible. Queda sin uso hasta que venza.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
