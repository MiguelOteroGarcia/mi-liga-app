import { createClient } from '@supabase/supabase-js'

// Traemos las llaves que guardaste en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creamos la conexión y la exportamos para poder usarla en cualquier parte de tu web
export const supabase = createClient(supabaseUrl, supabaseAnonKey)