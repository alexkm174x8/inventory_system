'use client';
import AddProductToStock from '@/components/AddProductToStock';
import { useRouter } from 'next/navigation';

export default function AgregarProductoPage() {
  const router = useRouter();

  return (
    <AddProductToStock
      onClose={() => router.push('/inventario')}
      onSaveStock={() => router.push('/inventario')}
    />
  );
}
