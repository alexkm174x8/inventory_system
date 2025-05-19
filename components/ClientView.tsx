'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useToast } from "@/components/ui/use-toast";
import { Plus, Minus } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  type: 'payment' | 'charge';
  description: string;
  created_at: string;
}

interface ClientViewProps {
  onClose: () => void;
}

const ClientView: React.FC<ClientViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  if (!params || !params.id) {
    return null;
  }
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientComprasNum, setClientComprasNum] = useState('');
  const [clientComprasTot, setClientComprasTot] = useState('');
  const [clientSaldo, setClientSaldo] = useState('');
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentType, setPaymentType] = useState<'payment' | 'charge'>('payment');
  const [updatingBalance, setUpdatingBalance] = useState(false);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_payments')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar el historial de pagos",
      });
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingrese un monto válido",
      });
      return;
    }

    try {
      setUpdatingBalance(true);
      const userId = await getUserId();
      const amount = parseFloat(paymentAmount);
      const newBalance = parseFloat(clientSaldo) + (paymentType === 'payment' ? amount : -amount);

      // Start a transaction
      const { error: paymentError } = await supabase
        .from('client_payments')
        .insert([
          {
            client_id: id,
            amount: amount,
            type: paymentType,
            description: paymentDescription || (paymentType === 'payment' ? 'Pago recibido' : 'Cargo aplicado'),
            user_id: userId,
          }
        ]);

      if (paymentError) throw paymentError;

      // Update client balance
      const { error: updateError } = await supabase
        .from('clients')
        .update({ saldo: newBalance })
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh data
      setClientSaldo(newBalance.toString());
      setPaymentAmount('');
      setPaymentDescription('');
      setShowPaymentForm(false);
      await fetchPayments();

      toast({
        title: "Éxito",
        description: paymentType === 'payment' ? "Pago registrado correctamente" : "Cargo aplicado correctamente",
      });
    } catch (err) {
      console.error('Error updating balance:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al actualizar el saldo",
      });
    } finally {
      setUpdatingBalance(false);
    }
  };

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const userId = await getUserId();
        
        // Get client details
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, name, phone, num_compras, total_compras, saldo')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (clientError || !clientData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Cliente no encontrado",
          });
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

        if (salesError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al cargar el historial de ventas",
          });
          throw salesError;
        }

        const lastMonthTotal = lastMonthSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
        
        setClientName(clientData.name);
        setClientPhone(clientData.phone);
        setClientId(clientData.id);
        setClientComprasNum(clientData.num_compras.toString());
        setClientComprasTot(clientData.total_compras.toString());
        setClientSaldo(clientData.saldo.toString());
        setLastMonthTotal(lastMonthTotal);

        // Fetch payment history
        await fetchPayments();
      } catch (err) {
        console.error('Error al cargar el cliente', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del cliente. Por favor, intenta de nuevo.",
        });
        router.push('/dashboard/clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchCliente();
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
            <h1 className="text-lg font-semibold capitalize">Cliente</h1>
            <p className="text-md font-light flex items-center gap-2">
              ID# {clientId}
            </p>
          </div>
          <div className="mt-3 mb-3">
            <h2 className="font-semibold">Detalles principales</h2>
          </div>
          <div className="mb-3 mt-3">
            <p><strong>Nombre: </strong> {clientName}</p>
            <p><strong>Número telefónico:</strong> {clientPhone}</p>
            <p><strong>Saldo actual:</strong> ${parseFloat(clientSaldo).toLocaleString('es-MX')} MXN</p>
          </div>
          <div className="mt-3 mb-3">
            <h2 className="font-semibold">Historial de compras</h2>
          </div>
          <div className="mb-6">
            <p><strong>Número de compras: </strong> {clientComprasNum}</p>
            <p><strong>Total de compras: </strong> ${parseFloat(clientComprasTot).toLocaleString('es-MX')} MXN</p>
            <p><strong>Compras del mes anterior: </strong> ${lastMonthTotal.toLocaleString('es-MX')} MXN</p>
          </div>

          {/* Payment History Section */}
          <div className="mt-6 mb-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Historial de Pagos</h2>
              <Button 
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {showPaymentForm ? 'Cancelar' : 'Registrar Pago/Cargo'}
              </Button>
            </div>
          </div>

          {showPaymentForm && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentType">Tipo de Movimiento</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={paymentType === 'payment' ? 'default' : 'outline'}
                        onClick={() => setPaymentType('payment')}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Pago
                      </Button>
                      <Button
                        type="button"
                        variant={paymentType === 'charge' ? 'default' : 'outline'}
                        onClick={() => setPaymentType('charge')}
                        className="flex-1"
                      >
                        <Minus className="w-4 h-4 mr-2" />
                        Cargo
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Ingrese el monto"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={paymentDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPaymentDescription(e.target.value)}
                    placeholder="Descripción del movimiento (opcional)"
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handlePayment}
                    disabled={updatingBalance || !paymentAmount}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {updatingBalance ? 'Procesando...' : 'Guardar Movimiento'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e6e6e6]">
              <thead>
                <tr className="bg-[#f5f5f5] text-center">
                  <th className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Fecha</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Monto</th>
                  <th className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e6e6] text-center">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      {new Date(payment.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.type === 'payment' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.type === 'payment' ? 'Pago' : 'Cargo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      ${parseFloat(payment.amount.toString()).toLocaleString('es-MX')} MXN
                    </td>
                    <td className="px-6 py-4 text-sm text-[#667085]">
                      {payment.description}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-[#667085] text-center">
                      No hay movimientos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
