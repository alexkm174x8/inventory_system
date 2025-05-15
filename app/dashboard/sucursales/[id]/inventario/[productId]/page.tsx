'use client';

import { useRouter } from 'next/navigation';
import ProductDetailView from '@/components/ProductDetailView';

export default function ProductDetailPage() {
  const router = useRouter();

  return (
    <div className='h-full m-5'>
      <ProductDetailView onClose={() => router.back()} />
    </div>
  );
}
