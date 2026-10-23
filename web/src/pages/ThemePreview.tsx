import { APP_NAME } from '@/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'

// Página de prueba de la Fase 1: muestra el tema visual de 10.6.
export default function ThemePreview() {
  return (
    <div className="mx-auto flex min-h-svh max-w-120 flex-col gap-6 px-4 py-4">
      <header>
        <p className="font-heading text-xl font-semibold">{APP_NAME}</p>
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="text-2xl">Tema visual</h1>
        <p className="text-muted-foreground">
          Texto en Inter sobre fondo crema. Los títulos llevan la serifa Lora.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Botones</h2>
        <Button>Botón principal</Button>
        <Button variant="secondary">Botón secundario</Button>
        <Button variant="destructive">Botón destructivo</Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Tarjeta</h2>
        <Card>
          <CardHeader>
            <CardTitle>Latte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Espresso con leche vaporizada.</p>
            <p className="font-semibold text-caramel">$4,00</p>
            <p className="text-sm text-muted-foreground">Bs 3.544,92</p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Etiquetas de estado</h2>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="created">Creado</StatusBadge>
          <StatusBadge tone="verifying">En verificación</StatusBadge>
          <StatusBadge tone="paid">Pagado · Listo para retirar</StatusBadge>
          <StatusBadge tone="expired">Expirado</StatusBadge>
          <StatusBadge tone="rejected">Rechazado: monto incorrecto</StatusBadge>
        </div>
      </section>
    </div>
  )
}
