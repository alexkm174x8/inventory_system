"use client";

import { useSearchParams } from 'next/navigation';
import CheckoutVenta from '@/components/CheckoutVenta';

export default function AgregarVentaPage() {
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
