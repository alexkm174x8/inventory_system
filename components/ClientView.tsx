'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';


interface ClientViewProps {
  onClose: () => void;
}

const ClientView: React.FC<ClientViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
  if (!params || !params.id) {
    return null;
  }
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientComprasNum, setClientComprasNum] = useState('');
  const [clientComprasTot, setClientComprasTot] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const userId = await getUserId();
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, phone, num_compras, total_compras')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          alert('Cliente no encontrado');
          router.push('/dashboard/clientes');
          return;
        }

        setClientName(data.name);
        setClientPhone(data.phone);
        setClientId(data.id);
        setClientComprasNum(data.num_compras.toString());
        setClientComprasTot(data.total_compras.toString());
      } catch (err) {
        console.error('Error al cargar el cliente', err);
        router.push('/dashboard/clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchCliente();
  }, [id, router]);

  if (loading) {
    return <div>Cargando cliente…</div>;
  }

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden mt-6">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3 flex-wrap gap-2">
            <h1 className="text-2xl font-bold  capitalize "> Cliente </h1>
            <p className="text-lg font-light flex items-center gap-2">
              ID# {clientId}
            </p>
          </div>
          <div className="mt-3 mb-3 ">
          <h2 className=" font-semibold">Detalles principales</h2>
          </div>
          <div className=" mb-3 mt-3">
            <p><strong>Nombre: </strong> {clientName}</p>
            <p><strong>Número telefónico:</strong> {clientPhone}</p>
          </div>
          <div className="mt-3 mb-3 ">
          <h2 className=" font-semibold">Historial de compras</h2>
          </div>
          <div >
            <p><strong>Número de compras: </strong> {clientComprasNum}</p>
            <p><strong>Total de compras: </strong> ${clientComprasTot} MXN</p>
          </div>
          <div className="text-center mt-6">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientView;
