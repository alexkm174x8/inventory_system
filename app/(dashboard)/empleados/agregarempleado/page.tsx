
'use client';

import React from 'react';
import AddEmployee from '@/components/AddEmployee';
import { useRouter } from 'next/navigation';

const AgregarEmpleadoPage = () => {
  const router = useRouter();

  const handleEmpleadoAgregado = () => {
    router.push('/empleados');
  };

  return (
    <div className='h-full m-5'>
      <AddEmployee
          onClose={() => router.back()} 
          onEmployeeAdded={handleEmpleadoAgregado}
        />
    </div>
  );
};

export default AgregarEmpleadoPage;