import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Category, Product } from '@/lib/types'

const KEY = ['manager', 'products']

type ProductsCache = { products: Product[] } | undefined

export function useManagerProducts() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<{ products: Product[] }>('/manager/products'),
  })
}

export interface ProductInput {
  name: string
  description: string
  priceCents: number
  category: Category
}

type ProductResponse = { product: Product }

interface ProductMutationOptions<TVars> {
  // Cambio inmediato en la lista, solo para banderas sin montos (agotado, baja).
  optimistic?: (product: Product, vars: TVars) => Product
  // Cambios que pueden alterar el orden de la lista (nombre, categoría) o que crean productos: se vuelve a pedir.
  refetch?: boolean
}

// El servidor devuelve el producto ya guardado: se escribe en la lista y no hace falta volver a pedirla.
export function useProductMutation<TVars extends { id?: string }>(
  request: (vars: TVars) => Promise<ProductResponse>,
  { optimistic, refetch }: ProductMutationOptions<TVars> = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onMutate: async (vars) => {
      if (!optimistic) return undefined
      await queryClient.cancelQueries({ queryKey: KEY })
      const previous = queryClient.getQueryData<ProductsCache>(KEY)
      queryClient.setQueryData<ProductsCache>(
        KEY,
        (old) =>
          old && {
            products: old.products.map((p) => (p.id === vars.id ? optimistic(p, vars) : p)),
          },
      )
      return { previous }
    },
    onSuccess: ({ product }) => {
      // Un producto recién creado se agrega a la lista para poder abrir su edición sin esperar al refetch.
      queryClient.setQueryData<ProductsCache>(
        KEY,
        (old) =>
          old && {
            products: old.products.some((p) => p.id === product.id)
              ? old.products.map((p) => (p.id === product.id ? product : p))
              : [...old.products, product],
          },
      )
      if (refetch) void queryClient.invalidateQueries({ queryKey: KEY })
      // Solo refrescan si esas pantallas están abiertas.
      void queryClient.invalidateQueries({ queryKey: ['menu'] })
      void queryClient.invalidateQueries({ queryKey: ['product'] })
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous)
      toast.error(err.message)
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export const productRequests = {
  create: (input: ProductInput & { id?: undefined }) =>
    api<ProductResponse>('/manager/products', { method: 'POST', body: input }),
  update: ({ id, ...input }: ProductInput & { id: string }) =>
    api<ProductResponse>(`/manager/products/${id}`, { method: 'PATCH', body: input }),
  setAvailability: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
    api<ProductResponse>(`/manager/products/${id}/availability`, {
      method: 'PATCH',
      body: { isAvailable },
    }),
  setActive: ({ id, isActive }: { id: string; isActive: boolean }) =>
    api<ProductResponse>(`/admin/products/${id}/active`, { method: 'PATCH', body: { isActive } }),
  uploadImage: ({ id, file }: { id: string; file: File }) => {
    const form = new FormData()
    form.append('image', file)
    return api<ProductResponse>(`/manager/products/${id}/image`, { method: 'POST', body: form })
  },
  removeImage: ({ id }: { id: string }) =>
    api<ProductResponse>(`/manager/products/${id}/image`, { method: 'DELETE' }),
}

// Opciones de cada acción, para usarlas igual en todas las pantallas.
export const productMutationOptions = {
  create: { refetch: true },
  update: { refetch: true },
  setAvailability: {
    optimistic: (product: Product, vars: { isAvailable: boolean }) => ({
      ...product,
      isAvailable: vars.isAvailable,
    }),
  },
  setActive: {
    optimistic: (product: Product, vars: { isActive: boolean }) => ({
      ...product,
      isActive: vars.isActive,
    }),
  },
}
