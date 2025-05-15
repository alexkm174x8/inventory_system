import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { adminId, newPassword } = await request.json();
    
    // Create a Supabase client with admin privileges
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Update the user's password using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      adminId,
      { password: newPassword }
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Contraseña actualizada exitosamente',
      user: authData.user 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado al actualizar la contraseña';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 