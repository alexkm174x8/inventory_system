'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { Package, ShoppingCart, Users, MapPin, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
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

interface SucursalViewProps {
  onClose?: () => void;
}

const SucursalView: React.FC<SucursalViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchSucursal = async () => {
      try {
        const userId = await getUserId();
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Sucursal no encontrada",
          });
          router.push('/dashboard/sucursales');
          return;
        }

        setName(data.name);
        setAddress(data.location);
      } catch (err) {
        console.error('Error al cargar la sucursal', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos de la sucursal. Por favor, intenta de nuevo.",
        });
        router.push('/dashboard/sucursales');
      } finally {
        setLoading(false);
      }
    };

    fetchSucursal();
  }, [id, router, toast]);

  const handleDeleteLocation = async () => {
    try {
      setIsDeleting(true);
      const userId = await getUserId();

      // First, check if there are any sales associated with this location
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('location', id)
        .eq('user_id', userId);

      if (salesError) throw salesError;

      if (sales && sales.length > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se puede eliminar la sucursal porque tiene ventas asociadas. Elimine las ventas primero.",
        });
        return;
      }

      // Check if there are any inventory items in this location
      const { data: inventory, error: inventoryError } = await supabase
        .from('location_inventory')
        .select('id')
        .eq('location', id)
        .eq('user_id', userId);

      if (inventoryError) throw inventoryError;

      if (inventory && inventory.length > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se puede eliminar la sucursal porque tiene inventario. Transfiera o elimine el inventario primero.",
        });
        return;
      }

      // If no sales or inventory, proceed with deletion
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      toast({
        title: "Éxito",
        description: "Sucursal eliminada correctamente",
      });

      router.push('/dashboard/sucursales');
    } catch (err) {
      console.error('Error al eliminar la sucursal:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la sucursal. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsDeleting(false);
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
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold capitalize">Sucursal {name}</h1>
              <p className="text-md font-light flex items-center gap-2 capitalize">
                <MapPin className="w-4 h-4" />
                {address}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar Sucursal'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro de eliminar esta sucursal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal.
                  </AlertDialogDescription>
                  <div className="mt-4">
                    <strong>Nota:</strong> No se puede eliminar una sucursal que tenga:
                    <ul className="list-disc list-inside mt-2">
                      <li>Ventas asociadas</li>
                      <li>Inventario en existencia</li>
                    </ul>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteLocation}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className=" w-full flex flex-col lg:flex-row justify-center items-center gap-6 mt-6 ">
            <button
              onClick={() => router.push(`/dashboard/sucursales/${id}/inventario`)}
              className=" sm:h-40 md:h-60  sm:w-full  lg:h-80 lg:w-1/2 px-6 py-6 flex flex-col items-center gap-4 justify-center rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors text-2xl"
            >
              <Package className="w-20 h-20" />
              Inventario
            </button>

            <button
              onClick={() => router.push(`/dashboard/sucursales/${id}/empleados`)}
              className=" sm:h-40 md:h-60  sm:w-full lg:h-80 lg:w-1/2 px-6 py-6 flex flex-col items-center gap-4 justify-center rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors text-2xl"
            >
              <Users className="w-20 h-20" />
              Empleados
            </button>
          </div>

          {onClose && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SucursalView;