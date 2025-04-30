'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { Package, ShoppingCart, Users, MapPin, ArrowLeft } from 'lucide-react';

interface SucursalViewProps {
  onClose?: () => void;
}

const SucursalView: React.FC<SucursalViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
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
          alert('Sucursal no encontrada');
          router.push('/sucursales');
          return;
        }

        setName(data.name);
        setAddress(data.location);
      } catch (err) {
        console.error('Error al cargar la sucursal', err);
        router.push('/sucursales');
      } finally {
        setLoading(false);
      }
    };

    fetchSucursal();
  }, [id]);

  return (
    <div className="h-full">
      <button 
        onClick={() => router.push('/sucursales')}
        className="mb-4 flex items-center gap-2 text-[#1366D9] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Sucursales
      </button>
      
      <Card className="w-full overflow-hidden mt-6">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3 flex-wrap gap-2">
            <h1 className="text-2xl font-bold">Sucursal {name}</h1>
            <p className="text-lg font-light flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {address}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row justify-center items-center gap-6 mt-6">
            <button
              onClick={() => router.push(`/sucursales/${id}/inventario`)}
              className="w-full lg:w-1/3 px-6 py-6 flex flex-col items-center gap-4 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors text-2xl"
            >
              <Package className="w-20 h-20" />
              Inventario
            </button>

            <button
              onClick={() => router.push(`/sucursales/${id}/ventas`)}
              className="w-full lg:w-1/3 px-6 py-6 flex flex-col items-center gap-4 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors text-2xl"
            >
              <ShoppingCart className="w-20 h-20" />
              Ventas
            </button>

            <button
              onClick={() => router.push(`/sucursales/${id}/empleados`)}
              className="w-full lg:w-1/3 px-6 py-6 flex flex-col items-center gap-4 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors text-2xl"
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