import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { adminId, businessName } = await request.json();
    
    if (!businessName) {
      return NextResponse.json({ error: 'Se requiere el nombre del negocio' }, { status: 400 });
    }

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

    // First get the admin's data to verify the name
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('user_id, name')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 });
    }

    // Verify the business name matches
    if (adminData.name !== businessName) {
      return NextResponse.json({ error: 'El nombre del negocio no coincide' }, { status: 400 });
    }

    // Delete related records in order
    // 1. Delete sales records
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .eq('user_id', adminData.user_id);

    if (salesError) {
      return NextResponse.json({ error: `Error al eliminar registros de ventas: ${salesError.message}` }, { status: 400 });
    }

    // 2. Delete stock records
    const { error: stockError } = await supabase
      .from('stock')
      .delete()
      .eq('user_id', adminData.user_id);

    if (stockError) {
      return NextResponse.json({ error: `Error al eliminar registros de inventario: ${stockError.message}` }, { status: 400 });
    }

    // 3. Delete employees associated with this admin
    // First get all employees for this admin
    const { data: employees, error: employeesFetchError } = await supabase
      .from('employees')
      .select('id, auth_id')
      .eq('user_id', adminData.user_id);

    if (employeesFetchError) {
      return NextResponse.json({ error: `Error al buscar empleados: ${employeesFetchError.message}` }, { status: 400 });
    }

    // Delete each employee's auth user if they have one
    if (employees && employees.length > 0) {
      for (const employee of employees) {
        if (employee.auth_id) {
          try {
            await supabase.auth.admin.deleteUser(employee.auth_id);
          } catch (error) {
            console.warn(`Warning: Could not delete auth user for employee ${employee.id}:`, error);
          }
        }
      }
    }

    // Now delete all employees
    const { error: employeesError } = await supabase
      .from('employees')
      .delete()
      .eq('user_id', adminData.user_id);

    if (employeesError) {
      return NextResponse.json({ error: `Error al eliminar empleados: ${employeesError.message}` }, { status: 400 });
    }

    // 4. Finally delete the admin record
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (deleteError) {
      return NextResponse.json({ error: `Error al eliminar el negocio: ${deleteError.message}` }, { status: 400 });
    }

    // 5. Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(adminData.user_id);

    if (authError) {
      console.warn('Warning: Could not delete auth user:', authError.message);
      // We don't return an error here because the admin record was already deleted
      // Just log the warning and continue
    }

    return NextResponse.json({ 
      message: 'Negocio eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error in delete-admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 