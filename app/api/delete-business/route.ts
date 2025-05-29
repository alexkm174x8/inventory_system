import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('id');

    console.log('Attempting to delete business with ID:', businessId);

    if (!businessId) {
      console.error('No business ID provided');
      return NextResponse.json(
        { error: 'ID de negocio no proporcionado' },
        { status: 400 }
      );
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

    // First get the business data using id (UUID)
    console.log('Fetching business data for ID:', businessId);
    const { data: businessData, error: businessError } = await supabase
      .from('admins')
      .select('id, user_id, name')
      .eq('id', businessId)
      .single();

    if (businessError) {
      console.error('Error fetching business:', businessError);
      return NextResponse.json(
        { error: `Error al buscar el negocio: ${businessError.message}` },
        { status: 400 }
      );
    }

    if (!businessData) {
      console.error('Business not found');
      return NextResponse.json(
        { error: 'No se encontró el negocio' },
        { status: 404 }
      );
    }

    // First try to delete the auth user
    if (businessData.id) {
      try {
        console.log('Attempting to delete auth user:', businessData.id);
        const { error: authError } = await supabase.auth.admin.deleteUser(
          businessData.id
        );

        if (authError) {
          console.error('Error deleting auth user:', authError);
          return NextResponse.json(
            { error: `Error al eliminar el usuario de autenticación: ${authError.message}` },
            { status: 400 }
          );
        }
        console.log('Auth user deleted successfully');
      } catch (authError: any) {
        console.error('Error during auth user deletion:', authError);
        return NextResponse.json(
          { error: `Error al eliminar el usuario de autenticación: ${authError.message}` },
          { status: 400 }
        );
      }
    }

    // Then delete the business record
    console.log('Attempting to delete business record');
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', businessId);

    if (deleteError) {
      console.error('Error deleting business record:', deleteError);
      return NextResponse.json(
        { error: `Error al eliminar el registro del negocio: ${deleteError.message}` },
        { status: 400 }
      );
    }

    console.log('Business record deleted successfully');

    return NextResponse.json({ 
      message: 'Negocio eliminado exitosamente',
      deletedBusiness: {
        id: businessId,
        name: businessData.name
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in delete-business:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
} 