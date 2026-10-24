import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'
import { FieldError } from '@/components/AuthShell'
import { BackLink } from '@/components/BackLink'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import {
  useAdminRewards,
  useCreateReward,
  useUpdateReward,
  type RewardInput,
} from '@/hooks/useAdminRewards'
import { useManagerProducts } from '@/hooks/useManagerProducts'
import type { Reward } from '@/lib/types'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Escribe el nombre.').max(80, 'El nombre es muy largo.'),
    type: z.enum(['PERCENT_DISCOUNT', 'FREE_PRODUCT']),
    percent: z.string(),
    productId: z.string(),
    costPoints: z
      .string()
      .regex(/^\d+$/, 'Escribe un número entero de puntos.')
      .refine((v) => Number(v) >= 1 && Number(v) <= 1_000_000, 'Debe estar entre 1 y 1.000.000.'),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'PERCENT_DISCOUNT') {
      const n = Number(v.percent)
      if (!/^\d+$/.test(v.percent) || n < 1 || n > 100) {
        ctx.addIssue({ code: 'custom', path: ['percent'], message: 'El porcentaje va de 1 a 100.' })
      }
    } else if (!v.productId) {
      ctx.addIssue({
        code: 'custom',
        path: ['productId'],
        message: 'Elige el producto que se regala.',
      })
    }
  })
type Values = z.infer<typeof schema>

export default function RewardFormPage() {
  const { id } = useParams()
  const rewards = useAdminRewards()

  if (!id) return <RewardForm />
  const reward = rewards.data?.rewards.find((r) => r.id === id)
  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/trabajo/recompensas" />
      {rewards.isPending && <LoadingBlock />}
      {rewards.isError && (
        <ErrorBlock message={rewards.error.message} onRetry={() => void rewards.refetch()} />
      )}
      {rewards.isSuccess && !reward && (
        <p className="py-12 text-center text-muted-foreground">Recompensa no encontrada.</p>
      )}
      {reward && <RewardForm reward={reward} />}
    </div>
  )
}

function RewardForm({ reward }: { reward?: Reward }) {
  const navigate = useNavigate()
  const products = useManagerProducts()
  const create = useCreateReward()
  const update = useUpdateReward()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: reward?.name ?? '',
      type: reward?.type ?? 'PERCENT_DISCOUNT',
      percent: reward?.percent ? String(reward.percent) : '',
      productId: reward?.productId ?? '',
      costPoints: reward ? String(reward.costPoints) : '',
    },
  })
  const type = useWatch({ control, name: 'type' })

  const onSubmit = (v: Values) => {
    const input: RewardInput = {
      name: v.name,
      type: v.type,
      percent: v.type === 'PERCENT_DISCOUNT' ? Number(v.percent) : null,
      productId: v.type === 'FREE_PRODUCT' ? v.productId : null,
      costPoints: Number(v.costPoints),
    }
    const done = (message: string) => ({
      onSuccess: () => {
        toast.success(message)
        navigate('/trabajo/recompensas')
      },
    })
    if (reward) update.mutate({ id: reward.id, ...input }, done('Cambios guardados.'))
    else create.mutate(input, done('Recompensa creada.'))
  }

  const saving = create.isPending || update.isPending
  const activeProducts = products.data?.products.filter((p) => p.isActive) ?? []

  return (
    <div className="flex flex-col gap-6">
      {!reward && <BackLink to="/trabajo/recompensas" />}
      <h1 className="text-2xl">{reward ? 'Editar recompensa' : 'Nueva recompensa'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Latte gratis"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Tipo</Label>
          <NativeSelect id="type" {...register('type')}>
            <option value="PERCENT_DISCOUNT">Descuento porcentual (a elección del cliente)</option>
            <option value="FREE_PRODUCT">Producto gratis</option>
          </NativeSelect>
        </div>
        {type === 'PERCENT_DISCOUNT' ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="percent">Porcentaje de descuento</Label>
            <Input
              id="percent"
              inputMode="numeric"
              placeholder="50"
              aria-invalid={!!errors.percent}
              {...register('percent')}
            />
            <FieldError message={errors.percent?.message} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="productId">Producto que se regala</Label>
            <NativeSelect
              id="productId"
              aria-invalid={!!errors.productId}
              {...register('productId')}
            >
              <option value="">Elige un producto</option>
              {activeProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError message={errors.productId?.message} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="costPoints">Costo en puntos</Label>
          <Input
            id="costPoints"
            inputMode="numeric"
            placeholder="800"
            aria-invalid={!!errors.costPoints}
            {...register('costPoints')}
          />
          <FieldError message={errors.costPoints?.message} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : reward ? 'Guardar cambios' : 'Crear recompensa'}
        </Button>
      </form>
    </div>
  )
}
