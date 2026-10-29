import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://seu-projeto.supabase.co' &&
  supabaseAnonKey !== 'sua-chave-publica-anon'
)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.info(
    'ℹ️ Supabase não configurado no .env.local. A interface executará em modo de demonstração até a inserção das credenciais reais.'
  )
}

// Inicializa cliente seguro (com fallback controlado para evitar exceção fatal de inicialização)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-instance.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key'
)
