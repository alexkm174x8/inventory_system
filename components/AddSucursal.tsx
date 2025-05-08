'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { Card, CardContent } from "@/components/ui/card";

interface AddSucursalProps {
  onClose: () => void;
  onSave: () => void;
}

const AddSucursal: React.FC<AddSucursalProps> = ({ onClose, onSave }) => {
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    location?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    let isValid = true;
    const newErrors: typeof errors = {};

    if (!locationName.trim()) {
      newErrors.name = 'El nombre es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(locationName)) {
      newErrors.name =
        'El nombre solo puede contener letras y espacios';
      isValid = false;
    }
    if (!locationAddress.trim()) {
      newErrors.location = 'La dirección es obligatoria';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const userId = await getUserId();

      const { error } = await supabase
        .from('locations')
        .insert({
          name: locationName,
          location: locationAddress,
          user_id: userId,
        });

      if (error) throw error;

      onSave();
    } catch (err) {
      console.error(err);
      setErrors(prev => ({
        ...prev,
        general: 'Error al guardar la sucursal',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <Card className="w-full">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold capitalize mb-4">
            Agregar nueva sucursal
          </h1>

          <div className="mb-4">
            <Label htmlFor="location-name">Nombre</Label>
            <Input
              id="location-name"
              value={locationName}
              className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Nombre de la sucursal"
              onChange={e => setLocationName(e.target.value)}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="location-address">Dirección</Label>
            <Input
              id="location-address"
              value={locationAddress}
              className={`mt-1 ${
                errors.location ? 'border-red-500' : ''
              }`}
              placeholder="Dirección de la sucursal"
              onChange={e => setLocationAddress(e.target.value)}
              required
            />
            {errors.location && (
              <p className="text-red-500 text-xs mt-1">
                {errors.location}
              </p>
            )}
          </div>

          {errors.general && (
            <p className="text-red-500 text-xs mt-2">
              {errors.general}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSucursal;

