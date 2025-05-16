'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Trash2, Pencil } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getUserId } from '@/lib/userId';

const EmployeeView: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeLocation, setEmployeeLocation] = useState<string | null>(null);
  const [employeeSalary, setEmployeeSalary] = useState('');
  const [employeePhone, setEmployeePhone] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const userId = await getUserId();
        const id = params?.id;
        if (!id) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "ID de empleado no proporcionado",
          });
          router.push('/dashboard/empleados');
          return;
        }
        
        // Get employee details
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*, locations(name)')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (employeeError || !employeeData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Empleado no encontrado",
          });
          router.push('/dashboard/empleados');
          return;
        }

        setEmployeeName(employeeData.name);
        setEmployeeEmail(employeeData.email);
        setEmployeeRole(employeeData.role);
        setEmployeeId(employeeData.id);
        setEmployeeLocation(employeeData.locations?.name || null);
        setEmployeeSalary(employeeData.salary.toString());
        setEmployeePhone(employeeData.phone.toString());
      } catch (err: unknown) {
        console.error('Error al cargar el empleado', err);
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
  }, [router, toast, params]);

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
          employeeId: employeeId,
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

      setNewPassword('');
      setConfirmPassword('');
      setIsResetDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al resetear la contraseña';
      setResetError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      console.log('Attempting to delete employee with ID:', employeeId);
      const response = await fetch(`/api/delete-employee?id=${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el empleado');
      }

      toast({
        title: "Éxito",
        description: `Empleado ${data.deletedEmployee?.name || ''} eliminado exitosamente`,
      });

      router.push('/dashboard/empleados');
    } catch (err: unknown) {
      console.error('Error deleting employee:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar el empleado';
      setDeleteError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setDeleteLoading(false);
      setIsDeleteDialogOpen(false);
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
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5] pb-10">
      <div className="flex gap-4 mb-6">
        <Card className="w-full overflow-hidden mt-6">
          <CardContent>
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
              <h1 className="text-2xl font-bold capitalize">Empleado</h1>
              <div className="flex items-center gap-4">
                <p className="text-md font-light flex items-center gap-2">ID# {employeeId}</p>
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
              <p><strong>Salario:</strong> ${employeeSalary} MXN</p>
              <p><strong>Rol:</strong> {employeeRole}</p>
              <p><strong>Sucursal:</strong> {employeeLocation}</p>
            </section>

            <div className="relative mt-6">
              <div className="lg:text-center mt-6 sm:text-left">
                <Button variant="outline" onClick={() => router.back()}>Cerrar</Button>
              </div>
              <div className="absolute bottom-0 right-0 flex gap-3">
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">
                      <Pencil className="w-4 h-4" />
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
                      <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={resetLoading}>Cancelar</Button>
                      <Button onClick={handlePasswordReset} disabled={resetLoading} className="bg-yellow-600 hover:bg-yellow-700">
                        {resetLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="text-white bg-red-600 hover:bg-red-700">
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro de eliminar este empleado?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de {employeeName} 
                        y todos sus datos asociados. El empleado ya no podrá acceder al sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                      <p className="text-sm text-red-500 mt-2">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteEmployee}
                        disabled={deleteLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleteLoading ? 'Eliminando...' : 'Sí, eliminar empleado'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default EmployeeView;



