// Ligação à base de dados Supabase.
// Lê os códigos do ficheiro .env (que está protegido e não vai para o GitHub).
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltam os códigos do Supabase. Verifica o ficheiro .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).',
  )
}

// Este "cliente" é o que vamos usar em todo o sistema para falar com a base de dados.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
