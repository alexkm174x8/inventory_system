'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  characteristics: {
    characteristics_id: number;
    name: string;
  }[];
  variants: {
    variant_id: number;
    sku: string;
    options: {
      option_id: number;
      value: string;
    }[];
  }[];
}

const EditarProductosPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadProducts = async () => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('Usuario no autenticado');

      const { data, error: supaErr } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_characteristics (
            characteristics_id,
            name
          ),
          productVariants (
            variant_id,
            sku,
            optionVariants (
              option_id,
              characteristics_options (
                id,
                values
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (supaErr) throw supaErr;

      const formattedProducts: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        characteristics: product.product_characteristics.map(pc => ({
          characteristics_id: pc.characteristics_id,
          name: pc.name
        })),
        variants: product.productVariants.map(variant => ({
          variant_id: variant.variant_id,
          sku: variant.sku,
          options: variant.optionVariants.map(opt => ({
            option_id: opt.option_id,
            value: opt.characteristics_options.values
          }))
        }))
      }));

      setProducts(formattedProducts);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (productId: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center h-screen bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center h-screen bg-[#f5f5f5]">
        <div className="text-red-500">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5] pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/inventario"
          className="px-3 py-2 flex items-center gap-2 rounded-sm border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Editar Productos</h1>
      </div>

      <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f5f5]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                  Características
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#667085] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e6e6]">
              {products.map(product => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#667085]">
                    {product.characteristics.map(c => c.name).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#667085]">
                    {product.variants.map(v => v.sku).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/inventario/editarproducto/${product.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar producto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deleteConfirm === product.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-2 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default EditarProductosPage; 