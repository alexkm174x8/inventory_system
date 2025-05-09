'use client';
import SucursalView from '@/components/SucursalView';
import { useRouter } from 'next/navigation';

export default function SucursalDetallePage() {
  const router = useRouter();

  return (
    <div className='h-full m-5'>
      <SucursalView
      onClose={() => router.push('/dashboard/sucursales')}
      />
    </div>
  );
}
