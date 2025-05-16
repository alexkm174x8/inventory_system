import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = 'https://dijctnuytoiqorvkcjmq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function getServerSession() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  return supabase.auth.getSession()
}

export async function getServerUser() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  return supabase.auth.getUser()
} 