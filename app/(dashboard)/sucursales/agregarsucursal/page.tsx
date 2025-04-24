'use client';

import AddSucursal from '@/components/AddSucursal';
import { useRouter } from 'next/navigation';

export default function NuevaSucursalPage() {
  const router = useRouter();

  return (
    <AddSucursal
      onClose={() => router.push('/sucursales')}
      onSave={() => router.push('/sucursales')}
    />
  );
}

