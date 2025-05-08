'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import EmployeeView from '@/components/EmpleadosView'
export default function EmployeeDetailPage() {
  const { locationId, employeeId } = useParams<{
    locationId: string
    employeeId: string
  }>()
  const router = useRouter()
  return (
    <div className="p-4">
      <EmployeeView
        onClose={() =>
          router.push(
            `/dashboard/sucursales/${locationId}/empleados`
          )
        }
      />
    </div>
  )
}