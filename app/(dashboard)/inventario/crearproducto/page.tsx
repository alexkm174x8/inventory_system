'use client';
import CreateProductView from '@/components/CreateProductView'; // Ajusta el path si es necesario
import { useRouter } from 'next/navigation';

export default function CrearProductoPage() {
  const router = useRouter();

  return (
    <CreateProductView
      onClose={() => router.push('/inventario')}
      onSaveProduct={() => router.push('/inventario')}
    />
  );
}
