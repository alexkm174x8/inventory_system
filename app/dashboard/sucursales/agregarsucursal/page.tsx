'use client';

import AddSucursal from '@/components/AddSucursal';
import { useRouter } from 'next/navigation';

export default function NuevaSucursalPage() {
  const router = useRouter();

  return (
    <div className='h-full m-5'>
      <AddSucursal
      onClose={() => router.push('/dashboard/sucursales')}
      onSave={() => router.push('/dashboard/sucursales')}
    />
    </div>

  );
}

