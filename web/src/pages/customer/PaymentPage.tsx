import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ClipboardPaste, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { BackLink } from '@/components/BackLink'
import { FieldError } from '@/components/AuthShell'
import { LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useBanks, useConfirmFree, usePreparePayment, useSubmitPayment } from '@/hooks/usePayment'
import { ApiError } from '@/lib/api'
import { copyText, digitsOnly, readClipboardText } from '@/lib/clipboard'
import { formatBs, formatUsd } from '@/lib/format'
import type { PreparedPayment, UnavailableItem } from '@/lib/types'

export default function PaymentPage() {
  const { id = '' } = useParams()
  const prepared = usePreparePayment(id)

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/checkout" />
      <h1 className="text-2xl">Pagar</h1>

      {prepared.isPending && <LoadingBlock />}
      {prepared.isError && (
        <PaymentBlocked error={prepared.error} onRetry={() => void prepared.refetch()} />
      )}
      {prepared.data &&
        (prepared.data.isFree ? (
          <FreeOrder checkoutId={id} />
        ) : (
          <PaymentSteps checkoutId={id} prepared={prepared.data} />
        ))}
    </div>
  )
}

// El servidor no deja pagar (producto agotado, bloqueo, tope de pedidos…): se explica el motivo.
function PaymentBlocked({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const items =
    error instanceof ApiError && error.code === 'ITEMS_UNAVAILABLE'
      ? (error.details as UnavailableItem[] | undefined)
      : undefined
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-warning/10 p-3 text-warning" role="alert">
        <p className="font-medium">{error.message}</p>
        {items && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {items.map((item) => (
              <li key={item.itemId}>
                {item.name}: {item.reason === 'SOLD_OUT' ? 'agotado' : 'ya no está disponible'}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button asChild>
        <Link to="/checkout">Volver al checkout</Link>
      </Button>
      <Button variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

// Total $0,00: nada que transferir (8.6).
function FreeOrder({ checkoutId }: { checkoutId: string }) {
  const navigate = useNavigate()
  const confirm = useConfirmFree(checkoutId)
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-caramel">{formatUsd(0)}</p>
        <p className="text-muted-foreground">
          Tu pedido está cubierto por cupones: no hay nada que pagar. Confírmalo para recibir tu QR.
        </p>
        <Button
          disabled={confirm.isPending}
          onClick={() =>
            confirm.mutate(undefined, {
              onSuccess: () => {
                toast.success('Pedido confirmado.')
                navigate('/pedidos', { replace: true })
              },
            })
          }
        >
          {confirm.isPending ? 'Confirmando…' : 'Confirmar pedido'}
        </Button>
      </CardContent>
    </Card>
  )
}

const schema = z.object({
  reference: z.string().regex(/^\d{6,22}$/, 'La referencia debe tener de 6 a 22 dígitos.'),
  bankCode: z.string().min(1, 'Elige el banco desde el que pagaste.'),
})
type Values = z.infer<typeof schema>

function PaymentSteps({ checkoutId, prepared }: { checkoutId: string; prepared: PreparedPayment }) {
  const navigate = useNavigate()
  const banks = useBanks()
  const submit = useSubmitPayment(checkoutId)
  const [pasteFailed, setPasteFailed] = useState(false)
  const payment = prepared.payment!

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reference: '', bankCode: '' },
  })

  const onCopy = async () => {
    if (await copyText(payment.clipboardText)) toast.success('Datos copiados')
    else toast.error('No se pudo copiar. Escribe los datos a mano.')
  }

  const onPaste = async () => {
    const text = await readClipboardText()
    if (text === null) {
      setPasteFailed(true)
      toast.info('Tu navegador no permite pegar desde aquí. Escribe la referencia a mano.')
      return
    }
    setPasteFailed(false)
    setValue('reference', digitsOnly(text), { shouldValidate: true })
  }

  const onSubmit = (values: Values) =>
    submit.mutate(values, {
      onSuccess: () => {
        toast.success('Referencia enviada. Un cajero la verificará en breve.')
        navigate('/checkout', { replace: true })
      },
    })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-lg">Pago Móvil</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted-foreground">Banco</dt>
            <dd className="font-medium">{payment.bank}</dd>
            <dt className="text-muted-foreground">Documento</dt>
            <dd className="font-medium">{payment.document}</dd>
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd className="font-medium">{payment.phone}</dd>
            <dt className="text-muted-foreground">Monto</dt>
            <dd>
              <span className="text-lg font-semibold">{formatBs(payment.amountBsCents)}</span>
              <span className="block text-sm text-muted-foreground">
                Referencia: {formatUsd(prepared.totalCents)}
              </span>
            </dd>
          </dl>
          <Button variant="secondary" onClick={() => void onCopy()}>
            <Copy strokeWidth={1.5} aria-hidden="true" />
            COPIAR TODO
          </Button>
        </CardContent>
      </Card>

      <p className="rounded-lg bg-warning/10 p-3 text-sm text-warning">
        Un pedido pagado no se cancela ni se reembolsa.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <h2 className="text-lg">Ya pagué</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reference">Referencia completa</Label>
          <div className="flex gap-2">
            <Input
              id="reference"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Solo dígitos"
              aria-invalid={!!errors.reference}
              {...register('reference', {
                onChange: (e) => setValue('reference', digitsOnly(e.target.value)),
              })}
            />
            <Button type="button" variant="outline" onClick={() => void onPaste()}>
              <ClipboardPaste strokeWidth={1.5} aria-hidden="true" />
              PEGAR
            </Button>
          </div>
          {pasteFailed && (
            <p className="text-sm text-muted-foreground">
              No pudimos leer el portapapeles: escribe la referencia a mano.
            </p>
          )}
          <FieldError message={errors.reference?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bankCode">Banco emisor</Label>
          <NativeSelect id="bankCode" aria-invalid={!!errors.bankCode} {...register('bankCode')}>
            <option value="">Elige tu banco</option>
            {banks.data?.banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.code} - {bank.name}
              </option>
            ))}
          </NativeSelect>
          <FieldError message={errors.bankCode?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" readOnly value={formatBs(payment.amountBsCents)} />
        </div>
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Enviando…' : 'Enviar referencia'}
        </Button>
      </form>
    </div>
  )
}
