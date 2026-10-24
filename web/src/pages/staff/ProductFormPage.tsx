import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'
import { FieldError } from '@/components/AuthShell'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ProductImage } from '@/components/ProductImage'
import { ErrorBlock, LoadingBlock } from '@/components/QueryState'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import {
  productMutationOptions,
  productRequests,
  useManagerProducts,
  useProductMutation,
} from '@/hooks/useManagerProducts'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDecimal, parseUsdToCents } from '@/lib/format'
import { CATEGORY_LABELS, type Category, type Product } from '@/lib/types'

const MAX_PRICE_CENTS = 1_000_000
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre.').max(80, 'El nombre es muy largo.'),
  description: z
    .string()
    .trim()
    .min(1, 'Escribe una descripción breve.')
    .max(300, 'La descripción es muy larga.'),
  price: z.string().refine((v) => {
    const cents = parseUsdToCents(v)
    return cents !== null && cents >= 1 && cents <= MAX_PRICE_CENTS
  }, 'Escribe el precio en dólares, por ejemplo 4,50.'),
  category: z.enum(['CAFE', 'BEBIDAS', 'POSTRES']),
})
type Values = z.infer<typeof schema>

export default function ProductFormPage() {
  const { id } = useParams()
  const products = useManagerProducts()

  if (!id) return <ProductForm />
  if (products.isPending) return <LoadingBlock />
  if (products.isError) {
    return <ErrorBlock message={products.error.message} onRetry={() => void products.refetch()} />
  }
  const product = products.data.products.find((p) => p.id === id)
  if (!product)
    return <p className="py-12 text-center text-muted-foreground">Producto no encontrado.</p>
  return <ProductForm product={product} />
}

function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const { has } = usePermissions()
  const create = useProductMutation(productRequests.create, productMutationOptions.create)
  const update = useProductMutation(productRequests.update, productMutationOptions.update)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product ? formatDecimal(product.priceCents) : '',
      category: product?.category ?? 'CAFE',
    },
  })

  const onSubmit = ({ price, ...rest }: Values) => {
    const input = { ...rest, priceCents: parseUsdToCents(price) ?? 0 }
    if (product) {
      update.mutate(
        { id: product.id, ...input },
        { onSuccess: () => toast.success('Cambios guardados.') },
      )
    } else {
      create.mutate(input, {
        onSuccess: ({ product: created }) => {
          toast.success('Producto creado. Ya puedes subirle una imagen.')
          navigate(`/trabajo/catalogo/${created.id}`, { replace: true })
        },
      })
    }
  }

  const saving = create.isPending || update.isPending

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{product ? 'Editar producto' : 'Nuevo producto'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          <FieldError message={errors.description?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Precio en dólares</Label>
          <Input
            id="price"
            inputMode="decimal"
            placeholder="4,50"
            aria-invalid={!!errors.price}
            {...register('price')}
          />
          <FieldError message={errors.price?.message} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categoría</Label>
          <NativeSelect id="category" {...register('category')}>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </form>

      {product && (
        <>
          <ImageSection product={product} />
          {has('admin') && <ActiveSection product={product} />}
        </>
      )}
    </div>
  )
}

function ImageSection({ product }: { product: Product }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useProductMutation(productRequests.uploadImage)
  const remove = useProductMutation(productRequests.removeImage)

  const onFile = (file: File | undefined) => {
    if (input.current) input.current.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('La imagen debe ser JPG, PNG o WebP.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('La imagen no puede pesar más de 2 MB.')
      return
    }
    upload.mutate({ id: product.id, file }, { onSuccess: () => toast.success('Imagen guardada.') })
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg">Imagen</h2>
      <ProductImage imageUrl={product.imageUrl} category={product.category} name={product.name} />
      {!product.imageUrl && (
        <p className="text-sm text-muted-foreground">
          Sin imagen propia: se muestra la imagen genérica de la categoría.
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button
        variant="secondary"
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
      >
        {upload.isPending ? 'Subiendo…' : product.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
      </Button>
      {product.imageUrl && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" disabled={remove.isPending}>
              Quitar imagen
            </Button>
          }
          title="¿Quitar la imagen?"
          description="El producto volverá a mostrar la imagen genérica de su categoría. La imagen actual se borra y no se puede recuperar."
          confirmLabel="Quitar imagen"
          destructive
          onConfirm={() =>
            remove.mutate({ id: product.id }, { onSuccess: () => toast.success('Imagen quitada.') })
          }
        />
      )}
      <p className="text-sm text-muted-foreground">JPG, PNG o WebP, de hasta 2 MB.</p>
    </section>
  )
}

// Solo el administrador: baja y reactivación (un producto nunca se borra).
function ActiveSection({ product }: { product: Product }) {
  const setActive = useProductMutation(productRequests.setActive, productMutationOptions.setActive)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg">Baja del producto</h2>
        {!product.isActive && <StatusBadge tone="expired">Dado de baja</StatusBadge>}
      </div>
      {product.isActive ? (
        <>
          <p className="text-sm text-muted-foreground">
            Un producto dado de baja desaparece del menú. Se conserva y puedes reactivarlo cuando
            quieras.
          </p>
          <ConfirmDialog
            trigger={<Button variant="destructive">Dar de baja</Button>}
            title="¿Dar de baja este producto?"
            description="Dejará de aparecer en el menú de los clientes. Podrás reactivarlo después."
            confirmLabel="Dar de baja"
            destructive
            onConfirm={() =>
              setActive.mutate(
                { id: product.id, isActive: false },
                { onSuccess: () => toast.success('Producto dado de baja.') },
              )
            }
          />
        </>
      ) : (
        <Button
          disabled={setActive.isPending}
          onClick={() =>
            setActive.mutate(
              { id: product.id, isActive: true },
              { onSuccess: () => toast.success('Producto reactivado.') },
            )
          }
        >
          Reactivar producto
        </Button>
      )}
    </section>
  )
}
