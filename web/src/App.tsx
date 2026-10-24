import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { GuestOnly, HomeRedirect, ProtectedRoute, RequirePerm } from '@/components/RouteGuards'
import { AuthProvider } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import CustomerLayout from '@/layouts/CustomerLayout'
import WorkLayout from '@/layouts/WorkLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import AccountPage from '@/pages/customer/AccountPage'
import CheckoutPage from '@/pages/customer/CheckoutPage'
import CouponsPage from '@/pages/customer/CouponsPage'
import HistoryPage from '@/pages/customer/HistoryPage'
import OrderDetailPage from '@/pages/customer/OrderDetailPage'
import OrdersPage from '@/pages/customer/OrdersPage'
import PaymentPage from '@/pages/customer/PaymentPage'
import PointsPage from '@/pages/customer/PointsPage'
import RewardsPage from '@/pages/customer/RewardsPage'
import MenuPage from '@/pages/customer/MenuPage'
import ProductPage from '@/pages/customer/ProductPage'
import CatalogPage from '@/pages/staff/CatalogPage'
import ProductFormPage from '@/pages/staff/ProductFormPage'
import AdminRewardsPage from '@/pages/staff/AdminRewardsPage'
import BaristaPage from '@/pages/staff/BaristaPage'
import RestorePage from '@/pages/staff/RestorePage'
import RewardFormPage from '@/pages/staff/RewardFormPage'
import ScanPage from '@/pages/staff/ScanPage'
import VerificationPage from '@/pages/staff/VerificationPage'
import { STAFF_SECTIONS } from '@/pages/staff/sections'
import WorkHome from '@/pages/staff/WorkHome'

// Secciones de trabajo que ya tienen su pantalla; el resto sigue como marcador de posición.
const HANDLED_PATHS = ['catalogo', 'verificacion', 'escanear', 'barra', 'restaurar', 'recompensas']

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los errores 4xx no se arreglan reintentando.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute account="customer" />}>
              <Route element={<CustomerLayout />}>
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/producto/:id" element={<ProductPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/pedidos" element={<OrdersPage />} />
                <Route path="/pedidos/:id" element={<OrderDetailPage />} />
                <Route path="/historial" element={<HistoryPage />} />
                <Route path="/pagar/:id" element={<PaymentPage />} />
                <Route path="/puntos" element={<PointsPage />} />
                <Route path="/recompensas" element={<RewardsPage />} />
                <Route path="/cupones" element={<CouponsPage />} />
                <Route path="/cuenta" element={<AccountPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute account="staff" />}>
              <Route path="/trabajo" element={<WorkLayout />}>
                <Route index element={<WorkHome />} />
                <Route element={<RequirePerm perms={['manager']} />}>
                  <Route path="catalogo" element={<CatalogPage />} />
                  <Route path="catalogo/nuevo" element={<ProductFormPage />} />
                  <Route path="catalogo/:id" element={<ProductFormPage />} />
                  <Route path="restaurar" element={<RestorePage />} />
                </Route>
                <Route element={<RequirePerm perms={['cashier']} />}>
                  <Route path="verificacion" element={<VerificationPage />} />
                  <Route path="escanear" element={<ScanPage />} />
                </Route>
                <Route element={<RequirePerm perms={['admin']} />}>
                  <Route path="recompensas" element={<AdminRewardsPage />} />
                  <Route path="recompensas/nueva" element={<RewardFormPage />} />
                  <Route path="recompensas/:id" element={<RewardFormPage />} />
                </Route>
                <Route element={<RequirePerm perms={['barista', 'manager']} />}>
                  <Route path="barra" element={<BaristaPage />} />
                </Route>
                {STAFF_SECTIONS.filter((section) => !HANDLED_PATHS.includes(section.path)).map(
                  (section) => (
                    <Route key={section.path} element={<RequirePerm perms={section.perms} />}>
                      <Route
                        path={section.path}
                        element={<PagePlaceholder title={section.label} />}
                      />
                    </Route>
                  ),
                )}
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}
