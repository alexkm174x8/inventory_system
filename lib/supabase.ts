import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = 'https://dijctnuytoiqorvkcjmq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Client-side Supabase instance
export const supabase = createBrowserClient(supabaseUrl, supabaseKey!)