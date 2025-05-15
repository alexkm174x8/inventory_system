'use client';

import React, { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Employee {
  id: number;
  name: string;
  email: string;
  salary: number;
  role: string;
  phone: number;
  locationId: number;
}

const LocationEmployees: React.FC = () => {
  const { id } = useParams();
  const locationId = Number(id);
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(employees.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = employees.slice(startIndex, startIndex + itemsPerPage);

  const loadEmployeesByLocation = async () => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('Usuario no autenticado');
      
      setError(null);
      setLoading(true);
      
      const { data, error: empError } = await supabase
        .from('employees')
        .select('id, name, email, salary, role, phone, location_id')
        .eq('location_id', locationId)
        .eq('user_id', userId);

      if (empError) throw empError;

      const formatted = (data || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        salary: emp.salary,
        role: emp.role,
        phone: emp.phone,
        locationId: emp.location_id,
      }));
      setEmployees(formatted);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar empleados';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationName = async () => {
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('Usuario no autenticado');
      
      const { data, error: locError } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (locError) throw locError;
      if (data?.name) {
        setLocationName(data.name);
      } else {
        setError('No se encontró la sucursal');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener nombre de sucursal';
      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (!isNaN(locationId)) {
      loadEmployeesByLocation();
      fetchLocationName();
    } else {
      setError('ID de sucursal inválido');
    }
  }, [locationId]);

  if (loading) {
    return (
      <main className="flex-1 flex justify-center items-center h-screen bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex justify-center items-center h-screen bg-[#f5f5f5]">
        <div className="text-red-500">{error}</div>
      </main>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mt-8">
        <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
          <h2 className="text-lg font-semibold capitalize">
            Empleados sucursal {locationName ? locationName : `#${locationId}`}
          </h2>
        </div> 
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f5f5] text-center">
                {['Nombre', 'Email', 'Salario', 'Rol', 'Teléfono', 'Acciones'].map(header => (
                  <th
                    key={header}
                    scope="col"
                    className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map(emp => (
                <tr key={emp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26] capitalize">{emp.name}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{emp.email}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">${emp.salary} MXN</td>
                  <td className="px-6 py-4 text-sm text-[#667085] capitalize">{emp.role}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{emp.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      aria-label={`Ver detalles de ${emp.name}`}
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => router.push(`/dashboard/sucursales/${id}/empleados/${emp.id}`)}
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
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Página anterior"
            className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-xs font-medium text-[#667085] uppercase tracking-wider">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Página siguiente"
            className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center m-9">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/sucursales/${locationId}`)}
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default LocationEmployees;
