'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

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

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const response = await fetch('/api/reset-employee-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: id,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al resetear la contraseña');
      }

      toast({
        title: "Éxito",
        description: "Contraseña actualizada exitosamente",
      });

      // Reset form and close dialog
      setNewPassword('');
      setConfirmPassword('');
      setIsResetDialogOpen(false);
    } catch (error: any) {
      setResetError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setResetLoading(false);
    }
  };

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
            <div className="flex items-center gap-4">
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50">
                    Resetear Contraseña
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resetear Contraseña</DialogTitle>
                    <DialogDescription>
                      Establece una nueva contraseña para {employeeName}. Asegúrate de comunicarle la nueva contraseña de forma segura.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingresa la nueva contraseña"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma la nueva contraseña"
                      />
                    </div>
                    {resetError && (
                      <p className="text-sm text-red-500">{resetError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsResetDialogOpen(false)}
                      disabled={resetLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={resetLoading}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {resetLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <p className="text-lg font-light">ID# {employeeId}</p>
            </div>
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

export default EmployeeView;



