import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  id: number;
  name: string;
  location: string;
  created_at: string;
  user_id: number;
}

// Simple Layout component for location details page
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-[#e6e6e6] py-4 px-6">
        <h1 className="text-xl font-bold text-[#1b1f26]">Trade Hub</h1>
      </header>
      <div className="container mx-auto py-4">
        {children}
      </div>
    </div>
  );
};

export default function LocationDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if ID is available (after hydration)
    if (id) {
      fetchLocationDetails();
    }
  }, [id]);

  const fetchLocationDetails = async () => {
    try {
      setLoading(true);
      const userId = await getUserId();

      // Option 1: Fetch from API (preferred method)
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setLocation(data);

      // Option 2: Get from localStorage (fallback)
      if (!data) {
        const savedLocation = localStorage.getItem('selectedLocation');
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation.id.toString() === id) {
            setLocation(parsedLocation);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
          </div>
        ) : location ? (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">{location.name}</h1>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-gray-500 text-sm">Dirección</h2>
                <p>{location.location}</p>
              </div>
              
              <div>
                <h2 className="text-gray-500 text-sm">Fecha de creación</h2>
                <p>{new Date(location.created_at).toLocaleDateString()}</p>
              </div>
              
              {/* Add more location details here as needed */}
              
              {/* You can add tabs or sections for related data such as:
                  - Inventory at this location
                  - Staff assigned to this location
                  - Sales data for this location
                  - etc. */}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontró información de esta sucursal</p>
          </div>
        )}
      </div>
    </Layout>
  );
}