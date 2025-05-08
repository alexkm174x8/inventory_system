'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import EmployeeView  from '@/components/EmpleadosView';

export default function Page() {
  const router = useRouter();
  return (
    <div className='h-full m-5'>
      <EmployeeView onClose={() => router.push('/dashboard/empleados')} />
    </div>
  );
}
