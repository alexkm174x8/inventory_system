'use client';
import React, { useState, useEffect } from 'react';
import { Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getUserId } from '@/lib/userId';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  user_id: number;
  auth_id: string;
  salary: number;
  phone: string;
  location_id: number;
  location_name?: string;
}

export default function EmpleadosContent() {

const router = useRouter();
const [employees, setEmployees] = useState<Employee[]>([]);
const [locationMap, setLocationMap] = useState<Record<number, string>>({});
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 6;
const totalPages = Math.ceil(employees.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const currentData = employees.slice(startIndex, startIndex + itemsPerPage);
const loadEmployeesAndLocations = async () => {

try {
  const userId = await getUserId();
  if (!userId) throw new Error('Usuario no autenticado.');
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, email, salary, role, phone, location_id, user_id, auth_id')
    .eq('user_id', userId);
  if (empError) throw empError;
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
  
  setEmployees(
    (employees || []).map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      user_id: emp.user_id,
      auth_id: emp.auth_id,
      salary: emp.salary,
      phone: emp.phone,
      location_id: emp.location_id,
      location_name: locMap[emp.location_id]
    }))
  );
  } catch (err: unknown) {
    console.error('Error loading employees:', err instanceof Error ? err.message : 'Unknown error');
  }
};

useEffect(() => {
  loadEmployeesAndLocations();
}, []);

return (
  <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5] pb-10">
    <div className="flex gap-4 mb-6">
      <button
      onClick={() => router.push('/dashboard/empleados/agregarempleado')}
      className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'
      >
        <Plus className="w-4 h-4" />
        Agregar Empleado
      </button>
    </div>
    <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mt-8">
      <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
        <h2 className="text-lg font-semibold capitalize">Lista de Empleados</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f5f5f5] text-center">
            {['Nombre','Email','Salario','Rol','Sucursal','Acciones'].map(h => (
            <th key={h} className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">
            {h}
            </th>
            ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6e6e6] text-center">
          {currentData.map(emp => (
            <tr key={emp.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">{emp.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{emp.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]"> ${emp.salary} MXN</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">{emp.role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085] capitalize">{locationMap[emp.location_id] ?? 'Desconocida'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => router.push(`/dashboard/empleados/${emp.id}`)}
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
    </div>
  </main>
  );
}

