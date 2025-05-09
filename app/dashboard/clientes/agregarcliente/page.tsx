'use client';

import AddClient from '@/components/AddClient';
import { useRouter } from 'next/navigation';

export default function NuevaSucursalPage() {
  const router = useRouter();

  return (
    <div className='h-full m-5'>
      <AddClient
        onClose={() => router.push('/dashboard/clientes')}
        onSave={() => router.push('/dashboard/clientes')}
    />
    </div>
  );
}
