'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

interface   NegociosViewProps {
  onClose: () => void;
}

const NegociosView: React.FC<NegociosViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  if (!params?.id) return null;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [negocioName, setNegocioName] = useState('');
  const [negocioBillingDay, setNegocioBillingDay] = useState('');
  const [negocioId, setNegocioId] = useState('');
  const [negocioBillingAmount, setNegocioBillingAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNegocio = async () => {
      try {
        const { data: negData, error: negErr } = await supabase
          .from('admins')
          .select('user_id, name, billing_day, billing_amount')
          .eq('user_id', id)
          .single();

        if (negErr || !negData) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Negocio no encontrado",
          });
          router.push('/dashboard-superadmin/negocios');
          return;
        }

        setNegocioId(negData.user_id.toString());
        setNegocioName(negData.name);
        setNegocioBillingDay(negData.billing_day.toString());
        setNegocioBillingAmount(negData.billing_amount.toString());

      } catch (err) {
        console.error('Error al cargar datos:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del negocio. Por favor, intenta de nuevo.",
        });
        router.push('/dashboard-superadmin/negocios');
      } finally {
        setLoading(false);
      }
    };

    fetchNegocio();
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
            <h1 className="text-2xl font-bold capitalize">Negocio</h1>
            <p className="text-lg font-light">ID# {negocioId}</p>
          </div>

          <section className="mt-6">
            <h2 className="font-semibold">Detalles principales</h2>
            <p><strong>Nombre:</strong> {negocioName}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-semibold">Características</h2>
            <p><strong>Cobro mensaul:</strong> ${negocioBillingAmount} MXN</p>
            <p><strong>Fecha de cobro:</strong> {negocioBillingDay} de cada mes</p>
          </section>

          <div className="text-center mt-6">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NegociosView;
