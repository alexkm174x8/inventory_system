"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CheckoutVenta from '@/components/CheckoutVenta';

function AgregarVentaContent() {
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId');

  if (!locationId) return <div>Falta seleccionar una sucursal</div>;

  return (
    <div className="p-6">
      <CheckoutVenta
        locationId={parseInt(locationId)}
        onClose={() => window.history.back()}
      />
    </div>
  );
}

export default function AgregarVentaPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <AgregarVentaContent />
    </Suspense>
  );
}

