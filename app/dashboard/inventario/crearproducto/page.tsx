'use client';
import CreateProductView from '@/components/CreateProductView'; // Ajusta el path si es necesario
import { useRouter } from 'next/navigation';

export default function CrearProductoPage() {
  const router = useRouter();

  return (
    <div className='h-full m-5'>
      <CreateProductView
        onClose={() => router.push('/dashboard/inventario')}
        onSaveProduct={() => router.push('/dashboard/inventario')}
    />
    </div>
  );
}
