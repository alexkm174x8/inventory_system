'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: number;
  name: string;
  location: string;
  created_at: string;
}

export default function SucursalesContent() {
  const [locations, setLocations] = useState<Location[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const loadLocations = async () => {

  setLoading(true);
  setError(null);
  try {
    const userId = await getUserId();
    if (!userId) throw new Error('Usuario no autenticado.');
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, location, created_at')
      .eq('user_id', userId)
    if (locError) throw locError;

    setLocations( 
      (locations || []).map(location => ({
      id: location.id, 
      name: location.name,
      location: location.location, 
      created_at: location.created_at

    }))

    );
  } catch (err: any) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadLocations()
}, [])

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5] pb-10">
      <div className="mb-6">
          <button onClick={() => router.push("/dashboard/sucursales/agregarsucursal")}
          className="px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors">
            <Plus className="w-4 h-4" />
            Agregar Sucursal
          </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hay sucursales registradas
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Link key={location.id} href={`/dashboard/sucursales/${location.id}`}>
              <div className="cursor-pointer bg-white shadow-sm border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold capitalize">{location.name}</h2>
                <p className="text-sm text-slate-600 mt-1 capitalize">{location.location}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};


