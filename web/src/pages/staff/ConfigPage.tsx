import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { FieldError } from '@/components/AuthShell'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useAdminSettings, useUpdateSettings } from '@/hooks/useAdmin'
import { useBanks } from '@/hooks/usePayment'
import type { AdminSettings } from '@/lib/types'

const DAYS = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '7', label: 'Domingo' },
]

const whole = (min: number, max: number, hint: string) =>
  z
    .string()
    .regex(/^\d+$/, 'Escribe un número entero.')
    .refine((v) => Number(v) >= min && Number(v) <= max, hint)

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Elige una hora.')

// Mismas reglas que el servidor (8.11); el servidor vuelve a validar todo.
const schema = z
  .object({
    pointsPerDollar: whole(1, 10_000, 'Entre 1 y 10.000.'),
    checkoutExpirationHours: whole(1, 720, 'Entre 1 y 720 horas.'),
    maxPaidUnscannedOrders: whole(1, 100, 'Entre 1 y 100.'),
    rejectionsBeforeBlock: whole(1, 20, 'Entre 1 y 20.'),
    blockMinutes: whole(1, 1440, 'Entre 1 y 1.440 minutos.'),
    referenceSubmissionsPerMinute: whole(1, 60, 'Entre 1 y 60.'),
    maxQuantityPerProduct: whole(1, 100, 'Entre 1 y 100.'),
    paymentDocType: z.enum(['V', 'E', 'J', 'G']),
    paymentDocNumber: z.string().regex(/^\d+$/, 'Solo dígitos.'),
    paymentBankCode: z.string().regex(/^\d{4}$/, 'Elige un banco.'),
    paymentPhone: z.string().regex(/^04\d{9}$/, 'Debe ser 04XXXXXXXXX (11 dígitos).'),
    openDays: z.array(z.string()).min(1, 'Elige al menos un día.'),
    openTime: time,
    closeTime: time,
  })
  .superRefine((v, ctx) => {
    const isRif = v.paymentDocType === 'J' || v.paymentDocType === 'G'
    const n = v.paymentDocNumber.length
    if (isRif ? n !== 9 : n < 6 || n > 9) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentDocNumber'],
        message: isRif ? 'El RIF debe tener 9 dígitos.' : 'La cédula debe tener de 6 a 9 dígitos.',
      })
    }
    if (v.closeTime <= v.openTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['closeTime'],
        message: 'El cierre debe ser posterior a la apertura.',
      })
    }
  })
type Values = z.infer<typeof schema>

const toValues = (s: AdminSettings): Values => ({
  pointsPerDollar: String(s.pointsPerDollar),
  checkoutExpirationHours: String(s.checkoutExpirationHours),
  maxPaidUnscannedOrders: String(s.maxPaidUnscannedOrders),
  rejectionsBeforeBlock: String(s.rejectionsBeforeBlock),
  blockMinutes: String(s.blockMinutes),
  referenceSubmissionsPerMinute: String(s.referenceSubmissionsPerMinute),
  maxQuantityPerProduct: String(s.maxQuantityPerProduct),
  paymentDocType: s.paymentDocType,
  paymentDocNumber: s.paymentDocNumber,
  paymentBankCode: s.paymentBankCode,
  paymentPhone: s.paymentPhone,
  openDays: s.openDays.map(String),
  openTime: s.openTime,
  closeTime: s.closeTime,
})

const toSettings = (v: Values): AdminSettings => ({
  pointsPerDollar: Number(v.pointsPerDollar),
  checkoutExpirationHours: Number(v.checkoutExpirationHours),
  maxPaidUnscannedOrders: Number(v.maxPaidUnscannedOrders),
  rejectionsBeforeBlock: Number(v.rejectionsBeforeBlock),
  blockMinutes: Number(v.blockMinutes),
  referenceSubmissionsPerMinute: Number(v.referenceSubmissionsPerMinute),
  maxQuantityPerProduct: Number(v.maxQuantityPerProduct),
  paymentDocType: v.paymentDocType,
  paymentDocNumber: v.paymentDocNumber,
  paymentBankCode: v.paymentBankCode,
  paymentPhone: v.paymentPhone,
  openDays: v.openDays.map(Number).sort((a, b) => a - b),
  openTime: v.openTime,
  closeTime: v.closeTime,
})

const NUMBER_FIELDS: { name: keyof Values; label: string; hint: string }[] = [
  {
    name: 'pointsPerDollar',
    label: 'Puntos por dólar',
    hint: 'Cuántos puntos se ganan por cada dólar pagado.',
  },
  {
    name: 'checkoutExpirationHours',
    label: 'Plazo del checkout (horas)',
    hint: 'Tiempo antes de que un checkout sin referencia expire.',
  },
  {
    name: 'maxPaidUnscannedOrders',
    label: 'Pedidos pagados sin retirar',
    hint: 'Máximo por cliente a la vez.',
  },
  {
    name: 'rejectionsBeforeBlock',
    label: 'Rechazos antes del bloqueo',
    hint: 'Rechazos seguidos de un mismo checkout.',
  },
  {
    name: 'blockMinutes',
    label: 'Duración del bloqueo (minutos)',
    hint: 'Tiempo sin poder reenviar la referencia.',
  },
  {
    name: 'referenceSubmissionsPerMinute',
    label: 'Envíos de referencia por minuto',
    hint: 'Máximo por cliente.',
  },
  {
    name: 'maxQuantityPerProduct',
    label: 'Máximo por producto',
    hint: 'Unidades de un mismo producto en un checkout.',
  },
]

export default function ConfigPage() {
  const settings = useAdminSettings()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Configuración</h1>
      {settings.isPending && <LoadingBlock />}
      {settings.isError && (
        <ErrorBlock message={settings.error.message} onRetry={() => void settings.refetch()} />
      )}
      {settings.data && <ConfigForm settings={settings.data.settings} />}
    </div>
  )
}

function ConfigForm({ settings }: { settings: AdminSettings }) {
  const save = useUpdateSettings()
  const banks = useBanks()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), values: toValues(settings) })

  const onSubmit = (values: Values) =>
    save.mutate(toSettings(values), { onSuccess: () => toast.success('Configuración guardada.') })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-lg">Parámetros</h2>
          {NUMBER_FIELDS.map(({ name, label, hint }) => (
            <div key={name} className="flex flex-col gap-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                inputMode="numeric"
                aria-invalid={!!errors[name]}
                {...register(name)}
              />
              <p className="text-sm text-muted-foreground">{hint}</p>
              <FieldError message={errors[name]?.message as string | undefined} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-lg">Datos de cobro (Pago Móvil)</h2>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="paymentDocType">Tipo</Label>
              <NativeSelect id="paymentDocType" {...register('paymentDocType')}>
                <option value="V">V</option>
                <option value="E">E</option>
                <option value="J">J</option>
                <option value="G">G</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="paymentDocNumber">Número de documento</Label>
              <Input
                id="paymentDocNumber"
                inputMode="numeric"
                aria-invalid={!!errors.paymentDocNumber}
                {...register('paymentDocNumber')}
              />
            </div>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">
            Cédula (V o E) de 6 a 9 dígitos, o RIF (J o G) de 9 dígitos. Se muestra como
            J-12345678-9.
          </p>
          <FieldError message={errors.paymentDocNumber?.message} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="paymentBankCode">Banco</Label>
            <NativeSelect
              id="paymentBankCode"
              aria-invalid={!!errors.paymentBankCode}
              {...register('paymentBankCode')}
            >
              {banks.data?.banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.code} - {bank.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.paymentBankCode?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="paymentPhone">Teléfono</Label>
            <Input
              id="paymentPhone"
              inputMode="numeric"
              placeholder="04141234567"
              aria-invalid={!!errors.paymentPhone}
              {...register('paymentPhone')}
            />
            <FieldError message={errors.paymentPhone?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-lg">Horario del local</h2>
          <p className="text-sm text-muted-foreground">
            Hora de Caracas. Es el mismo horario para todos los días abiertos.
          </p>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">Días abiertos</legend>
            {DAYS.map((day) => (
              <label key={day.value} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  value={day.value}
                  className="size-5 accent-primary"
                  {...register('openDays')}
                />
                {day.label}
              </label>
            ))}
            <FieldError message={errors.openDays?.message} />
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openTime">Apertura</Label>
              <Input
                id="openTime"
                type="time"
                aria-invalid={!!errors.openTime}
                {...register('openTime')}
              />
              <FieldError message={errors.openTime?.message} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="closeTime">Cierre</Label>
              <Input
                id="closeTime"
                type="time"
                aria-invalid={!!errors.closeTime}
                {...register('closeTime')}
              />
              <FieldError message={errors.closeTime?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending || !isDirty}>
        {save.isPending ? 'Guardando…' : 'Guardar configuración'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Los cambios aplican desde ese momento. No se recalculan los pedidos existentes.
      </p>
    </form>
  )
}
