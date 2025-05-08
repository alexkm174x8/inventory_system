'use client';

import React from 'react';
import AddNegocio from '@/components/AddNegocio';
import { useRouter } from 'next/navigation';

const AgregarNegocioPage = () => {
  const router = useRouter();

  const handleNegocioAgregado = () => {
    router.push('/dashboard-superadmin/negocios');
  };

  return (
    <div className='h-full m-5'>
      <AddNegocio
          onClose={() => router.back()} 
          onNegocioAdded={handleNegocioAgregado}
        />
    </div>
  );
};

export default AgregarNegocioPage;