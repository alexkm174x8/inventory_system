'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProductDetailView from '@/components/ProductDetailView';

export default function Page() {
  const router = useRouter();
  return (
    <div className='h-full m-5'>
      <ProductDetailView onClose={() => router.push('/dashboard/inventario')} />
    </div>
  );
}

