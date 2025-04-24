'use client';
import SucursalView from '@/components/SucursalView';
import { useRouter } from 'next/navigation';

export default function SucursalDetallePage() {
  const router = useRouter();

  return (
    <SucursalView
      onClose={() => router.push('/sucursales')}
    />
  );
}
