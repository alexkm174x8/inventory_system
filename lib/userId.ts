import { supabase } from "@/lib/supabase";

export async function getUUID() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.id) {
    return session.user.id;
  }

  return null;
}

export async function getUserId() {
  const userId = await getUUID();

  if (userId) {
    const { data: profile, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error details:', error);
      return null;
    }

    const numericId = profile ? Number(profile.user_id) : null;
    
    return numericId;
  } else {
    console.error('No user ID found.');
    return null;
  }
}

export async function getUserRole() {
  const userId = await getUUID();

  if (userId) {
    const { data: profile, error } = await supabase
      .from('admins')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error details:', error);
      return null;
    }

    return profile?.role;
  }
}