'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProductDetailView from '@/components/ProductDetailView';

export default function Page() {
  const router = useRouter();
  return (
    <ProductDetailView onClose={() => router.push('/inventario')} />
  );
}

