'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

interface EmployeeViewProps {
  onClose: () => void;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  if (!params?.id) return null;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeSalary, setEmployeeSalary] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [employeeLocationName, setEmployeeLocationName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { data: empData, error: empErr } = await supabase
          .from('employees')
          .select('id, name, email, salary, role, phone, location_id')
          .eq('id', id)
          .single();

        if (empErr || !empData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Empleado no encontrado",
          });
          router.push('/dashboard/empleados');
          return;
        }

        setEmployeeId(empData.id.toString());
        setEmployeeName(empData.name);
        setEmployeeEmail(empData.email);
        setEmployeeSalary(empData.salary.toString());
        setEmployeeRole(empData.role);
        setEmployeePhone(empData.phone.toString());

        const { data: locData, error: locError } = await supabase
          .from('locations')
          .select('name')
          .eq('id', empData.location_id)
          .maybeSingle();

        if (locError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al cargar la información de la sucursal",
          });
        }

        setEmployeeLocationName(locData?.name ?? 'Desconocida');
      } catch (err) {
        console.error('Error al cargar datos:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del empleado. Por favor, intenta de nuevo.",
        });
        router.push('/dashboard/empleados');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, router, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden mt-6">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
            <h1 className="text-2xl font-bold capitalize">Empleado</h1>
            <p className="text-lg font-light">ID# {employeeId}</p>
          </div>

          <section className="mt-6">
            <h2 className="font-semibold">Detalles principales</h2>
            <p><strong>Nombre:</strong> {employeeName}</p>
            <p><strong>Email:</strong> {employeeEmail}</p>
            <p><strong>Teléfono:</strong> {employeePhone}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-semibold">Características</h2>
            <p><strong>Salario:</strong> {employeeSalary}</p>
            <p><strong>Rol:</strong> {employeeRole}</p>
            <p><strong>Sucursal:</strong> {employeeLocationName}</p>
          </section>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeView ;



