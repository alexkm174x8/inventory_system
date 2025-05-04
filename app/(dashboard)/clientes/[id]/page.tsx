'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ClientView from '@/components/ClientView';

export default function Page() {
  const router = useRouter();
  return (
    <div className='h-full m-5'>
      <ClientView onClose={() => router.push('/clientes')} />
    </div>
  );
}
