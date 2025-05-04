'use client';

import React, { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  name: string;
  email: string;
  salary: number;
  role: string;
  phone: number;
  locationId: number;
}

export default function EmpleadosContent() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locationMap, setLocationMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = employees.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const userId = await getUserId();
        if (!userId) throw new Error('Usuario no autenticado.');
        const { data: locs, error: locErr } = await supabase
          .from('locations')
          .select('id, name')
          .eq('user_id', userId);
        if (locErr) throw locErr;

        const map: Record<number, string> = {};
        (locs || []).forEach(l => {
          if (l.id != null && l.name) map[l.id] = l.name;
        });
        setLocationMap(map);
        const { data: emps, error: empErr } = await supabase
          .from('employees')
          .select('id, name, email, salary, role, phone, location_id');
        if (empErr) throw empErr;

        const formatted: Employee[] = (emps || []).map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          salary: e.salary,
          role: e.role,
          phone: e.phone,
          locationId: e.location_id,
        }));

        setEmployees(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return (
    <main className="flex-1 flex justify-center items-center h-screen bg-[#f5f5f5]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]" />
    </main>
  );

  if (error) return (
    <main className="flex-1 flex justify-center items-center h-screen bg-[#f5f5f5]">
      <div className="text-red-500">{error}</div>
    </main>
  );

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      <div className="flex gap-4 mb-9">
        <button
          onClick={() => router.push('/empleados/agregarempleado')}
          className="px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Empleado
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-[#e6e6e6]">
          <h2 className="text-lg font-medium text-[#1b1f26]">Lista de Empleados</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f5f5] text-center">
                {['Nombre', 'Email', 'Salario', 'Rol', 'Sucursal', 'Acciones'].map(header => (
                  <th
                    key={header}
                    className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#e6e6e6] text-center">
              {currentData.map(emp => (
                <tr key={emp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26] capitalize">
                    {emp.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                    {emp.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                    {emp.salary}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]  capitalize">
                    {emp.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">
                    {locationMap[emp.locationId] ?? 'Desconocida'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/empleados/${emp.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Eye className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-[#e6e6e6] flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-xs font-medium text-[#667085] uppercase tracking-wider">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

