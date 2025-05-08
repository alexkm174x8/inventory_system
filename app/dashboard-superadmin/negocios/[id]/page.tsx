'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import NegociosView from '@/components/NegociosView';

export default function Page() {
  const router = useRouter();
  return (
    <div className='h-full m-5'>
      <NegociosView onClose={() => router.push('/dashboard-superadmin/negocios')} />
    </div>
  );
}