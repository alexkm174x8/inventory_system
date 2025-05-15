'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  user_id: number;
  variants: Variant[];
}

interface Variant {
  product_id: number;
  stock: number;
  price: number;
  location_id: number;
  location_name?: string;
  added_at: string;
}

const InventarioContent: React.FC = () => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'ConStock'>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationMap, setLocationMap] = useState<Record<number, string>>({});

  const itemsPerPage = 6;

  const filtered = products.filter(item =>
    filterStatus === 'Todos' ? true : item.variants.some(v => v.stock > 0)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const loadProductsAndLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('Usuario no autenticado.');

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, description, user_id')
        .eq('user_id', userId);

      if (prodError) throw prodError;

      const { data: variants, error: varError } = await supabase
        .from('variants')
        .select('*')
        .in('product_id', products?.map(p => p.id) || []);

      if (varError) throw varError;

      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('user_id', userId);

      if (locError) throw locError;

      const locMap: Record<number, string> = {};
      locations?.forEach(loc => {
        if (loc.id != null && loc.name) locMap[loc.id] = loc.name;
      });
      setLocationMap(locMap);

      const productsWithVariants = products?.map(product => ({
        ...product,
        variants: variants?.filter(v => v.product_id === product.id).map(v => ({
          ...v,
          location_name: locMap[v.location_id]
        })) || []
      })) || [];

      setProducts(productsWithVariants);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar inventario';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsAndLocations();
  }, []);

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
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard/inventario/crearproducto')}
          className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'
        >
          <Plus className="w-4 h-4" />
          Crear producto
        </button>
        <button
          onClick={() => router.push('/dashboard/inventario/agregarinventario')}
          className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'
        >
          <Plus className="inline-block w-4 h-4 mr-1" />
          Agregar Inventario
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Inventory Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Inventario Total</h2>
            <Package className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              {products.reduce((sum, product) => sum + product.variants.reduce((sum, variant) => sum + variant.stock, 0), 0)}
            </span>
            <span className="ml-2 text-sm text-gray-500">unidades</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Total de productos en inventario</p>
        </div>

        {/* Products with Stock Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Productos con Stock</h2>
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              {products.filter(product => product.variants.some(v => v.stock > 0)).length}
            </span>
            <span className="ml-2 text-sm text-gray-500">productos</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Productos disponibles actualmente</p>
        </div>

        {/* Products without Stock Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md border border-[#e6e6e6] transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold capitalize">Productos sin Stock</h2>
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              {products.filter(product => product.variants.every(v => v.stock === 0)).length}
            </span>
            <span className="ml-2 text-sm text-gray-500">productos</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">Productos que necesitan reabastecimiento</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
          <h2 className="text-lg font-semibold capitalize">Lista de Inventario</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f5f5] text-center">
                {['Producto', 'Características', 'Cantidad', 'Ubicación', 'Fecha', 'Ver más'].map(h => (
                  <th key={h} className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map(product => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">{product.variants.map(v => `${v.location_name ?? 'Desconocido'}: ${v.stock}`).join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{product.variants.reduce((sum, v) => sum + v.stock, 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">{product.variants.map(v => v.location_name).join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{product.variants.map(v => new Date(v.added_at).toLocaleDateString()).join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/dashboard/inventario/${product.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Eye className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[#e6e6e6] flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-xs font-medium text-[#667085] uppercase tracking-wider">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default InventarioContent;