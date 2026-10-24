import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useReport } from '@/hooks/useAdmin'
import { formatBs, formatDate, formatUsd } from '@/lib/format'
import { CATEGORY_LABELS, type ReportPeriod, type SalesReport } from '@/lib/types'

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'custom', label: 'Rango' },
]

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Colores de la paleta: verde como serie principal y caramelo como segunda (10.6).
const unitsConfig = { units: { label: 'Unidades', color: 'var(--primary)' } } satisfies ChartConfig
const hourConfig = { orders: { label: 'Pedidos', color: 'var(--primary)' } } satisfies ChartConfig
const dayConfig = { orders: { label: 'Pedidos', color: 'var(--caramel)' } } satisfies ChartConfig

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const report = useReport(period, from, to)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Reportes</h1>
      <SegmentedControl label="Período" value={period} options={PERIODS} onChange={setPeriod} />

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from">Desde</Label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">Hasta</Label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      )}
      {period === 'custom' && (from === '' || to === '') && (
        <EmptyBlock>Elige las dos fechas para ver el reporte.</EmptyBlock>
      )}

      {report.isFetching && !report.data && <LoadingBlock />}
      {report.isError && (
        <ErrorBlock message={report.error.message} onRetry={() => void report.refetch()} />
      )}
      {report.data && <ReportView report={report.data} />}
    </div>
  )
}

function ReportView({ report }: { report: SalesReport }) {
  const first = formatDate(report.period.start)
  const last = formatDate(new Date(new Date(report.period.end).getTime() - 1))

  if (report.totals.orders === 0) {
    return <EmptyBlock>{`No hay ventas del ${first} al ${last}.`}</EmptyBlock>
  }

  const hours = report.demandByHour.map((orders, hour) => ({ hour: String(hour), orders }))
  const days = report.demandByWeekday.map((orders, i) => ({ day: WEEKDAYS[i]!, orders }))
  const top = report.topProducts.map((p) => ({ name: p.name, units: p.units }))

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Ventas del {first} al {last}
      </p>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total vendido</p>
            <p className="text-xl font-semibold text-caramel">
              {formatUsd(report.totals.totalCents)}
            </p>
            <p className="text-sm text-muted-foreground">{formatBs(report.totals.totalBsCents)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pedidos</p>
            <p className="text-xl font-semibold">{report.totals.orders}</p>
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Por categoría</h2>
        <Breakdown
          rows={report.byCategory.map((c) => ({
            key: c.category,
            name: CATEGORY_LABELS[c.category],
            units: c.units,
            amountCents: c.amountCents,
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Productos más vendidos</h2>
        <ChartContainer config={unitsConfig} className="aspect-auto h-72 w-full">
          <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="units" fill="var(--color-units)" radius={4} />
          </BarChart>
        </ChartContainer>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Demanda por hora</h2>
        <ChartContainer config={hourConfig} className="aspect-auto h-60 w-full">
          <BarChart data={hours}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={1} />
            <YAxis allowDecimals={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={(h) => `${h}:00 h`} />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={3} />
          </BarChart>
        </ChartContainer>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Demanda por día de la semana</h2>
        <ChartContainer config={dayConfig} className="aspect-auto h-60 w-full">
          <BarChart data={days}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={3} />
          </BarChart>
        </ChartContainer>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Por producto</h2>
        <Breakdown
          rows={report.byProduct.map((p) => ({
            key: p.productId,
            name: p.name,
            units: p.units,
            amountCents: p.amountCents,
          }))}
        />
      </section>
    </div>
  )
}

function Breakdown({
  rows,
}: {
  rows: { key: string; name: string; units: number; amountCents: number }[]
}) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
      <li className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-sm text-muted-foreground">
        <span>Nombre</span>
        <span className="w-16 text-right">Unidades</span>
        <span className="w-24 text-right">Importe</span>
      </li>
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3">
          <span>{row.name}</span>
          <span className="w-16 text-right font-semibold">{row.units}</span>
          <span className="w-24 text-right">{formatUsd(row.amountCents)}</span>
        </li>
      ))}
    </ul>
  )
}
