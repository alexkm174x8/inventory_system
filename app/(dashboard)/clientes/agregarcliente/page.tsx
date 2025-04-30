'use client';

import AddClient from '@/components/AddClient';
import { useRouter } from 'next/navigation';

export default function NuevaSucursalPage() {
  const router = useRouter();

  return (
    <AddClient
      onClose={() => router.push('/clientes')}
      onSave={() => router.push('/clientes')}
    />
  );
}
