import { supabase } from './supabase'

export async function getEffectiveUserId(authUserId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('get_effective_user_id', {
        auth_user_id: authUserId
      })

    if (error) {
      console.error('Error getting effective user ID:', error)
      throw new Error('Error getting effective user ID')
    }

    return data
  } catch (error) {
    console.error('Error in getEffectiveUserId:', error)
    throw error
  }
}

export async function getUserId(): Promise<string> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error getting session:', sessionError)
      throw new Error('Error getting session')
    }

    if (!session?.user?.id) {
      throw new Error('No session found')
    }

    // Get the effective user ID (admin's ID for employees)
    const effectiveUserId = await getEffectiveUserId(session.user.id)
    
    // Get the numeric user_id from the admins table
    const { data: profile, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('id', effectiveUserId)
      .single()

    if (error) {
      console.error('Error getting user_id:', error)
      throw new Error('Error getting user_id')
    }

    if (!profile?.user_id) {
      throw new Error('User ID not found')
    }

    return profile.user_id
  } catch (error) {
    console.error('Error in getUserId:', error)
    throw error
  }
}

export async function getUserRole() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return null
    }

    if (!session?.user?.id) {
      return null
    }

    const { data: role, error } = await supabase
      .rpc('get_user_role', {
        auth_user_id: session.user.id
      })

    if (error) {
      console.error('Error getting user role:', error)
      return null
    }

    return role
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}