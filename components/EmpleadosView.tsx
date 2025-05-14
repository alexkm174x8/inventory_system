'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface EmployeeViewProps {
}

const EmployeeView: React.FC<EmployeeViewProps> = () => {
  const params = useParams();
  const router = useRouter();
  const employeeIdFromParams = params?.employeeId || params?.id;
  const employeeId = Array.isArray(employeeIdFromParams) ? employeeIdFromParams[0] : employeeIdFromParams;

  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeSalary, setEmployeeSalary] = useState('');
  const [employeeDbId, setEmployeeDbId] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeLocationName, setEmployeeLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) {
        console.warn('No se proporcionó un ID de empleado.');
        setError('No se proporcionó un ID de empleado.');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const { data: empData, error: empErr } = await supabase
          .from('employees')
          .select('id, name, email, salary, role, phone, location_id')
          .eq('id', employeeId)
          .single();

        if (empErr || !empData) {
          console.error('Error al cargar el empleado:', empErr?.message || 'Empleado no encontrado');
          setError('Empleado no encontrado.');
          return;
        }

        setEmployeeDbId(empData.id.toString());
        setEmployeeName(empData.name);
        setEmployeeEmail(empData.email);
        setEmployeeSalary(empData.salary.toString());
        setEmployeeRole(empData.role);
        setEmployeePhone(empData.phone.toString());

        const { data: locData } = await supabase
          .from('locations')
          .select('name')
          .eq('id', empData.location_id)
          .maybeSingle();

        setEmployeeLocationName(locData?.name ?? 'Desconocida');
      } catch (err: any) {
        console.error('Error al cargar datos:', err.message || err);
        setError('Error al cargar la información del empleado.');
        router.push('/dashboard/empleados'); 
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden mt-6">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
            <h1 className="text-2xl font-bold capitalize">{employeeName}</h1>
            <p className="text-lg font-light">ID# {employeeDbId}</p>
          </div>

          <section className="mt-6">
            <h2 className="font-semibold">Detalles principales</h2>
            <p><strong>Nombre:</strong> {employeeName}</p>
            <p><strong>Email:</strong> {employeeEmail}</p>
            <p><strong>Teléfono:</strong> {employeePhone}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-semibold">Características</h2>
            <p><strong>Salario:</strong> ${employeeSalary} MXN</p>
            <p><strong>Rol:</strong> {employeeRole}</p>
            <p><strong>Sucursal:</strong> {employeeLocationName}</p>
          </section>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => router.back()}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeView;



