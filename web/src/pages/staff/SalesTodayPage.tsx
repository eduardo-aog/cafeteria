import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Card, CardContent } from '@/components/ui/card'
import { useSalesToday } from '@/hooks/useAdmin'
import { formatBs, formatUsd } from '@/lib/format'

// Resumen de ventas del día, solo lectura (gerente y administrador): total en $ y Bs, pedidos y unidades por producto.
export default function SalesTodayPage() {
  const sales = useSalesToday()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Ventas de hoy</h1>
      {sales.isPending && <LoadingBlock />}
      {sales.isError && (
        <ErrorBlock message={sales.error.message} onRetry={() => void sales.refetch()} />
      )}
      {sales.data && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <span className="text-muted-foreground">Total vendido</span>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-semibold text-caramel">
                    {formatUsd(sales.data.totals.totalCents)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatBs(sales.data.totals.totalBsCents)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-muted-foreground">Pedidos</span>
                <span className="text-lg font-semibold">{sales.data.totals.orders}</span>
              </div>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg">Unidades por producto</h2>
            {sales.data.units.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">Todavía no hay ventas hoy.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
                {sales.data.units.map((row) => (
                  <li
                    key={row.productId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span>{row.name}</span>
                    <span className="font-semibold">{row.units}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
