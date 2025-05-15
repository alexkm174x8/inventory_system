'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { Package, ShoppingCart, Users, MapPin, ArrowLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

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
            <h1 className="text-lg font-semibold capitalize">Sucursal {name}</h1>
            <p className="text-md font-light flex items-center gap-2 capitalize">
              <MapPin className="w-4 h-4 " />
              {address}
            </p>
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