'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

interface AddSucursalProps {
  onClose: () => void;
  onSave: () => void;
}

const AddSucursal: React.FC<AddSucursalProps> = ({ onClose, onSave }) => {
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!locationName.trim() || !locationAddress.trim()) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const userId = await getUserId();

      const { error } = await supabase.from('locations').insert({
        name: locationName,
        location: locationAddress,
        user_id: userId,
      });

      if (error) throw error;

      onSave(); // vuelve a /sucursales
    } catch (error) {
      console.error(error);
      alert('Error al guardar la sucursal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-semibold mb-4">Agregar nueva sucursal</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Agregue el nombre de la sucursal"
          />
        </div>

        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="Agregue la dirección de la sucursal"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            className="bg-blue-500 hover:bg-blue-600" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddSucursal;

