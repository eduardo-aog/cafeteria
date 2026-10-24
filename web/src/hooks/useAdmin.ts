import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { AdminSettings, ReportPeriod, SalesReport, SalesToday, StaffUser } from '@/lib/types'

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api<{ settings: AdminSettings }>('/admin/settings'),
  })
}

// Los cambios aplican desde ese momento; los datos que dependen de ellos se vuelven a pedir.
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: AdminSettings) =>
      api<{ settings: AdminSettings }>('/admin/settings', { method: 'PATCH', body: settings }),
    onSuccess: ({ settings }) => {
      queryClient.setQueryData(['admin', 'settings'], { settings })
      void queryClient.invalidateQueries({ queryKey: ['menu'] })
      void queryClient.invalidateQueries({ queryKey: ['checkouts'] })
    },
    onError: (err) => toast.error(err.message),
  })
}

// Busca una cuenta por correo exacto (9.7). No se pide sola: solo cuando hay un correo enviado.
export function useFindUser(email: string) {
  return useQuery({
    queryKey: ['admin', 'user', email],
    queryFn: () => api<{ user: StaffUser }>(`/admin/users?email=${encodeURIComponent(email)}`),
    enabled: email !== '',
    retry: false,
    gcTime: 0,
  })
}

export function useSetPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...permissions
    }: { id: string } & Pick<StaffUser, 'canCashier' | 'canBarista' | 'canManager'>) =>
      api<{ user: StaffUser }>(`/admin/users/${id}/permissions`, {
        method: 'PATCH',
        body: permissions,
      }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['admin', 'user', user.email], { user })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'user'] })
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useReport(period: ReportPeriod, from: string, to: string) {
  const custom = period === 'custom'
  return useQuery({
    queryKey: ['admin', 'report', period, custom ? from : '', custom ? to : ''],
    queryFn: () =>
      api<SalesReport>(`/admin/reports?period=${period}${custom ? `&from=${from}&to=${to}` : ''}`),
    enabled: !custom || (from !== '' && to !== ''),
    retry: false,
  })
}

export function useSalesToday() {
  return useQuery({
    queryKey: ['manager', 'sales-today'],
    queryFn: () => api<SalesToday>('/manager/sales-today'),
  })
}
