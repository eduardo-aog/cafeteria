import { supabase } from '@/lib/supabase'

export interface ApiErrorDetail {
  path: string
  message: string
}

export class ApiError extends Error {
  code: string
  status: number
  // Datos extra del servidor: campos inválidos (validación) o líneas afectadas (ITEMS_UNAVAILABLE).
  details?: unknown

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

// fetch con el token de la sesión. Ante un 401 cierra la sesión: la guarda de rutas lleva a /login.
export async function api<T>(path: string, { method = 'GET', body }: ApiOptions = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        // Con FormData el navegador pone el Content-Type (con el boundary).
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor.', 0)
  }

  if (response.ok) return (await response.json()) as T

  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: unknown }
  } | null
  const error = new ApiError(
    payload?.error?.code ?? 'UNKNOWN_ERROR',
    payload?.error?.message ?? 'Ocurrió un error inesperado.',
    response.status,
    payload?.error?.details,
  )
  if (response.status === 401 && token) await supabase.auth.signOut()
  throw error
}
