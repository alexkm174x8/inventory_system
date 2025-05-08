'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface   NegociosViewProps {
  onClose: () => void;
}

const NegociosView: React.FC<NegociosViewProps> = ({ onClose }) => {
  const params = useParams();
  const router = useRouter();
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
          alert('Negocio no encontrado');
          router.push('/dashboard-superadmin/negocios');
          return;
        }

        setNegocioId(negData.user_id.toString());
        setNegocioName(negData.name);
        setNegocioBillingDay(negData.billing_day.toString());
        setNegocioBillingAmount(negData.billing_amount.toString());

      } catch (err) {
        console.error('Error al cargar datos:', err);
        router.push('/dashboard-superadmin/negocios');
      } finally {
        setLoading(false);
      }
    };

    fetchNegocio();
  }, [id, router]);

  if (loading) {
    return <div>Cargando negocio…</div>;
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
