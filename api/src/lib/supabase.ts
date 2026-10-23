import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

// Cliente con la clave privada: SOLO para el servidor.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
