'use client';
import React, { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Negocio {
  id: number;
  name: string;
  billingDay: number;
  billingAmount: string;
}

export default function NegociosContent() {
  const router = useRouter();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(negocios.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = negocios.slice(startIndex, startIndex + itemsPerPage);

  const loadNegocios = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Usuario no autenticado.');

      // Verify superadmin using id_sa
      const { data: superAdmin, error: superAdminError } = await supabase
        .from('super_admin')
        .select('id_sa')
        .eq('id_sa', session.user.id)
        .single();

      if (superAdminError) throw superAdminError;
      if (!superAdmin) throw new Error('Superadmin no encontrado');

      // Get all businesses
      const { data: negocios, error: empError } = await supabase
        .from('admins')
        .select('id, name, billing_day, billing_amount')
        .order('name');

      if (empError) throw empError;

      setNegocios(
        (negocios || []).map(neg => ({
          id: neg.id,
          name: neg.name,
          billingDay: neg.billing_day,
          billingAmount: String(neg.billing_amount),
        }))
      );

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNegocios();
  }, []);

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(amount));

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      <div className="flex gap-4 mb-9">
        <button
          onClick={() => router.push('/dashboard-superadmin/negocios/agregarnegocio')}
          className="px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Negocio
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
          <h2 className="text-lg font-medium text-[#1b1f26]">Lista de Negocios</h2>
        </div>

        {loading ? (
          <div className="px-6 py-4 text-center text-[#667085]">Cargando negocios...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f5f5] text-center">
                  {['Nombre', 'Cobro mensual', 'Fecha de cobro', 'Acciones'].map(h => (
                    <th
                      key={h}
                      className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e6e6] text-center">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-[#667085]">
                      No hay negocios registrados.
                    </td>
                  </tr>
                ) : (
                  currentData.map(neg => (
                    <tr key={neg.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26] capitalize">{neg.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{formatCurrency(neg.billingAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{neg.billingDay} de cada mes</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/dashboard-superadmin/negocios/${neg.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

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
        )}

        {error && (
          <div className="px-6 py-4 text-red-600 text-sm border-t border-[#e6e6e6]">
            Error: {error}
          </div>
        )}
      </div>
    </main>
  );
}
