import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useMe } from '@/hooks/useMe'

// Por ahora solo el saldo; el historial y las recompensas llegan en la Fase 8.
export default function PointsPage() {
  const { data: me } = useMe()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Puntos</h1>
      <Card>
        <CardContent className="flex items-center gap-3">
          <Star className="size-6 text-caramel" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="text-2xl font-semibold">{me ? me.pointsBalance : '…'} puntos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
