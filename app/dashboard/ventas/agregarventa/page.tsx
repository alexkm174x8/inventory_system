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
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
      </div>
    }>
      <AgregarVentaContent />
    </Suspense>
  );
}

