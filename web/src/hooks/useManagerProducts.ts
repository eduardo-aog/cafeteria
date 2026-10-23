import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Category, Product } from '@/lib/types'

const KEY = ['manager', 'products']

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

// Tras cada cambio se refrescan la lista del gerente y el menú del cliente.
export function useProductMutation<TVars>(request: (vars: TVars) => Promise<{ product: Product }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY })
      void queryClient.invalidateQueries({ queryKey: ['menu'] })
      void queryClient.invalidateQueries({ queryKey: ['product'] })
    },
    onError: (err) => toast.error(err.message),
  })
}

type ProductResponse = { product: Product }

export const productRequests = {
  create: (input: ProductInput) =>
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
