import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'ID de producto no proporcionado' },
        { status: 400 }
      );
    }

    // Create a Supabase client
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

    // Simple delete from stock table
    const { error: deleteError } = await supabase
      .from('stock')
      .delete()
      .eq('id', parseInt(productId, 10));

    if (deleteError) {
      console.error('Error deleting stock entry:', deleteError);
      return NextResponse.json(
        { error: `Error al eliminar el producto: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Producto eliminado exitosamente',
      deletedProduct: { id: productId }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado al eliminar el producto';
    console.error('Error in delete-product:', errorMessage);
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 });
  }
} 