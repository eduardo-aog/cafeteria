import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFindUser, useSetPermissions } from '@/hooks/useAdmin'
import { ApiError } from '@/lib/api'
import type { StaffUser } from '@/lib/types'

type Flags = Pick<StaffUser, 'canCashier' | 'canBarista' | 'canManager'>

// Asignación de permisos (administrador): se busca una cuenta ya registrada por su correo y se activan o
// desactivan cajero, barista y gerente. El permiso de administrador no se asigna desde aquí (8.1).
export default function PermissionsPage() {
  const [input, setInput] = useState('')
  const [email, setEmail] = useState('')
  const found = useFindUser(email)

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    setEmail(input.trim())
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Permisos</h1>

      <form onSubmit={onSearch} className="flex flex-col gap-2">
        <Label htmlFor="email">Correo de la cuenta</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            autoComplete="off"
            placeholder="correo@ejemplo.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" disabled={input.trim() === ''}>
            Buscar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Debe ser una cuenta ya registrada. La búsqueda es por el correo completo.
        </p>
      </form>

      {email !== '' && found.isFetching && <LoadingBlock />}
      {found.isError &&
        (found.error instanceof ApiError && found.error.status === 404 ? (
          <p className="rounded-lg bg-muted p-3 text-sm" role="alert">
            {found.error.message}
          </p>
        ) : (
          <ErrorBlock message={found.error.message} onRetry={() => void found.refetch()} />
        ))}
      {found.data && !found.isFetching && (
        <UserPermissions key={found.data.user.id} user={found.data.user} />
      )}
    </div>
  )
}

function UserPermissions({ user }: { user: StaffUser }) {
  const save = useSetPermissions()
  const [flags, setFlags] = useState<Flags>({
    canCashier: user.canCashier,
    canBarista: user.canBarista,
    canManager: user.canManager,
  })
  const changed =
    flags.canCashier !== user.canCashier ||
    flags.canBarista !== user.canBarista ||
    flags.canManager !== user.canManager

  const toggles: { key: keyof Flags; label: string; hint: string; disabled?: boolean }[] = [
    { key: 'canCashier', label: 'Cajero', hint: 'Verifica pagos y escanea pedidos.' },
    { key: 'canBarista', label: 'Barista', hint: 'Ve la cola de barra y entrega pedidos.' },
    {
      key: 'canManager',
      label: 'Gerente',
      hint: user.isAdmin
        ? 'El administrador ya tiene todo lo del gerente.'
        : 'Administra productos, ve las ventas del día y restaura pedidos.',
      disabled: user.isAdmin,
    },
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm break-all text-muted-foreground">{user.email}</p>
          </div>
          {user.isAdmin ? (
            <StatusBadge tone="paid">Administrador</StatusBadge>
          ) : (
            <StatusBadge tone={user.isStaff ? 'verifying' : 'created'}>
              {user.isStaff ? 'Cuenta de trabajo' : 'Cliente'}
            </StatusBadge>
          )}
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="sr-only">Permisos</legend>
          {toggles.map(({ key, label, hint, disabled }) => (
            <label
              key={key}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-2 has-disabled:cursor-not-allowed has-disabled:opacity-60"
            >
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 accent-primary"
                checked={flags[key]}
                disabled={disabled}
                onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
              />
              <span>
                <span className="block font-medium">{label}</span>
                <span className="block text-sm text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {!user.isAdmin &&
          !flags.canCashier &&
          !flags.canBarista &&
          !flags.canManager &&
          user.isStaff && (
            <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
              Si guardas sin ningún permiso, esta cuenta vuelve a ser de cliente.
            </p>
          )}

        <Button
          disabled={!changed || save.isPending}
          onClick={() =>
            save.mutate(
              { id: user.id, ...flags },
              {
                onSuccess: () =>
                  toast.success('Permisos guardados. La cuenta los verá al recargar la página.'),
              },
            )
          }
        >
          {save.isPending ? 'Guardando…' : 'Guardar permisos'}
        </Button>
      </CardContent>
    </Card>
  )
}
