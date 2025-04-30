'use client';
import CheckoutVenta from '@/components/CheckoutVenta';
import LocationSelector from '@/components/locationSelection';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AgregarProductoPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const handleLocationSelected = (locationId: number) => {
    setSelectedLocation(locationId);
    setIsDialogOpen(false); 
    console.log('Selected location ID:', locationId);
  };

  if (selectedLocation === null) {
    return (
      <div className="p-6">
        <LocationSelector
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onLocationSelected={handleLocationSelected}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <CheckoutVenta
        onClose={() => router.push('/ventas')}
        locationId={selectedLocation}
      />
    </div>
  );
}
