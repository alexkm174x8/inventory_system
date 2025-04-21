import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

interface Location {
  id: number;
  name: string;
  location: string;
  created_at: string;
  user_id: number;
}

const SucursalesContent: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const userId = await getUserId();
        
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);

  const handleSaveLocation = async () => {
    try {
      const userId = await getUserId();
      
      let newLocation;
      
      if (editingLocation) {
        // Update existing location
        const { data, error } = await supabase
          .from('locations')
          .update({
            name: locationName,
            location: locationAddress,
          })
          .eq('id', editingLocation.id)
          .eq('user_id', userId)
          .select();
          
        if (error) throw error;
        newLocation = data?.[0];
      } else {
        // Insert new location
        const { data, error } = await supabase
          .from('locations')
          .insert({
            name: locationName,
            location: locationAddress,
            user_id: userId,
          })
          .select();
          
        if (error) throw error;
        newLocation = data?.[0];
      }
      
      // Update the local state
      if (newLocation) {
        if (editingLocation) {
          setLocations(locations.map(loc => 
            loc.id === editingLocation.id ? newLocation : loc
          ));
        } else {
          setLocations([newLocation, ...locations]);
        }
      }
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error al guardar la sucursal. Intente nuevamente.');
    }
  };
  
  const handleDeleteLocation = async (id: number) => {
    if (!confirm('¿Está seguro que desea eliminar esta sucursal?')) return;
    
    try {
      const userId = await getUserId();
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update local state
      setLocations(locations.filter(loc => loc.id !== id));
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Error al eliminar la sucursal. Intente nuevamente.');
    }
  };
  
  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setLocationAddress(location.location);
    setShowAddLocation(true);
  };
  
  const resetForm = () => {
    setLocationName('');
    setLocationAddress('');
    setEditingLocation(null);
    setShowAddLocation(false);
  };

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      {showAddLocation ? (
        <div className="p-6 bg-white shadow-md rounded-lg max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-3">
            {editingLocation ? 'Editar sucursal' : 'Agregar nueva sucursal'}
          </h2>
          <div className="space-y-2">
            <Label htmlFor="location-name">Nombre</Label>
            <Input
              id="location-name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Nombre de la sucursal"
            />
          </div>
          <div className="mt-3">
            <div className="space-y-2">
              <Label htmlFor="location-address">Dirección</Label>
              <Input
                id="location-address"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Agregue la dirección"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3 gap-3">
            <Button variant="outline" type="button" onClick={resetForm}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveLocation}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Guardar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => setShowAddLocation(true)}
              className="px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar sucursal
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 justify-items-center md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {locations.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No hay sucursales registradas</p>
                </div>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className="relative flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg w-full hover:shadow-md transition-shadow"
                  >
                    <div className="flex p-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold">{location.name}</h2>
                        <p className="text-sm text-slate-600 mt-1">{location.location}</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditLocation(location)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocation(location.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default SucursalesContent;