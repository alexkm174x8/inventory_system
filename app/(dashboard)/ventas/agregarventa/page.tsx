'use client';
import CheckoutVenta from '@/components/CheckoutVenta';
import { useRouter } from 'next/navigation';

export default function AgregarProductoPage() {
  const router = useRouter();

  return (
    <CheckoutVenta
        onClose={() => router.push('/ventas')}>
    </CheckoutVenta>
  );
}