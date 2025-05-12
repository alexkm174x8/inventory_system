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
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const userId = await getUserId();
        
        // Get client details
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, name, phone, num_compras, total_compras')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (clientError || !clientData) {
          alert('Cliente no encontrado');
          router.push('/dashboard/clientes');
          return;
        }

        // Get last month's sales for this client
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const { data: lastMonthSales, error: salesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('client', id)
          .eq('user_id', userId)
          .gte('created_at', firstDayLastMonth.toISOString())
          .lte('created_at', lastDayLastMonth.toISOString());

        if (salesError) throw salesError;

        const lastMonthTotal = lastMonthSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
        
        setClientName(clientData.name);
        setClientPhone(clientData.phone);
        setClientId(clientData.id);
        setClientComprasNum(clientData.num_compras.toString());
        setClientComprasTot(clientData.total_compras.toString());
        setLastMonthTotal(lastMonthTotal);
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
            <h1 className="text-2xl font-bold capitalize">Cliente</h1>
            <p className="text-lg font-light flex items-center gap-2">
              ID# {clientId}
            </p>
          </div>
          <div className="mt-3 mb-3">
            <h2 className="font-semibold">Detalles principales</h2>
          </div>
          <div className="mb-3 mt-3">
            <p><strong>Nombre: </strong> {clientName}</p>
            <p><strong>Número telefónico:</strong> {clientPhone}</p>
          </div>
          <div className="mt-3 mb-3">
            <h2 className="font-semibold">Historial de compras</h2>
          </div>
          <div>
            <p><strong>Número de compras: </strong> {clientComprasNum}</p>
            <p><strong>Total de compras: </strong> ${parseFloat(clientComprasTot).toLocaleString('es-MX')} MXN</p>
            <p><strong>Compras del mes anterior: </strong> ${lastMonthTotal.toLocaleString('es-MX')} MXN</p>
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
