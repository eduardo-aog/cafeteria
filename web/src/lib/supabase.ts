import { createClient } from '@supabase/supabase-js'

// Solo se usa para iniciar y cerrar sesión y para obtener el token (8.1).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
