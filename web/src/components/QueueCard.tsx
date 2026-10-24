import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatTime } from '@/lib/format'
import type { QueueOrder } from '@/lib/types'

// Tarjeta de las colas de trabajo (10.6): código corto destacado arriba, nombre y hora a la derecha,
// ítems en lista y, abajo, el botón de acción a todo el ancho.
export function QueueCard({
  order,
  time,
  timeLabel,
  children,
}: {
  order: QueueOrder
  time: string | null
  timeLabel: string
  children?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="font-sans text-xl font-semibold tracking-[0.2em]">{order.pickupCode}</p>
          <div className="text-right">
            <p className="font-medium">{order.customerName}</p>
            {time && (
              <p className="text-sm text-muted-foreground">
                {timeLabel} {formatTime(time)}
              </p>
            )}
          </div>
        </div>
        <ul className="flex flex-col gap-1 border-t border-border pt-3">
          {order.items.map((item) => (
            <li key={item.id}>
              <span className="font-semibold">{item.quantity} ×</span> {item.name}
            </li>
          ))}
        </ul>
        {children}
      </CardContent>
    </Card>
  )
}
