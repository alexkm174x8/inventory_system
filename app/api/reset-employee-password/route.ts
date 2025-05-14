import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { employeeId, newPassword } = await request.json();
    
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

    // First get the auth_id from the employee record
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('auth_id')
      .eq('id', employeeId)
      .single();

    if (employeeError || !employeeData?.auth_id) {
      return NextResponse.json(
        { error: 'No se encontró el ID de autenticación del empleado' },
        { status: 400 }
      );
    }

    // Update the user's password using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      employeeData.auth_id,
      { password: newPassword }
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Contraseña actualizada exitosamente',
      user: authData.user 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 