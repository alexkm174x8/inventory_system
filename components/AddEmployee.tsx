'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {Card, CardContent} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AddEmployeeProps {
  onClose: () => void;
  onEmployeeAdded: () => void;
}

interface Location {
  id: number;
  name: string;
  location: string;
  user_id?: string;
}

const AddEmployee: React.FC<AddEmployeeProps> = ({ onClose, onEmployeeAdded }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);
      setLocationsError(null);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, location');
        if (error) throw error;
        setLocations(data || []);
      } catch (err: any) {
        console.error('Error al cargar sucursales:', err);
        setLocationsError(err.message);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedLocationId) {
      setError('Por favor, selecciona una sucursal.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .insert([
          {
            name,
            email,
            salary: parseFloat(salary),
            role, // El valor de 'role' ya es 'admin' o 'empleado'
            phone: parseInt(phone),
            location_id: selectedLocationId,
          },
        ]);

      if (error) {
        throw error;
      }

      console.log('Empleado agregado exitosamente');
      setLoading(false);
      onEmployeeAdded();
      onClose();
    } catch (err: any) {
      console.error('Error al agregar empleado:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
   <div className="h-full">
         <Card className="w-full">
           <CardContent className="p-6">
               <h1 className="text-2xl font-bold  capitalize mb-4">Agregar empleado</h1>
  
          <div className="mb-4">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              className="mt-1"
              placeholder="Nombre del empleado"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
  
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1"
              value={email}
              placeholder="Correo electrónico"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
  
          <div className="mb-4">
            <Label htmlFor="salary">Salario</Label>
            <Input
              id="salary"
              type="number"
              className="mt-1"
              value={salary}
              placeholder="Salario"
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>
  
          <div className="mb-4">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              className="mt-1"
              value={phone}
              placeholder="Número telefónico"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
  
          <div className="mb-4">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'empleado')}
              required
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </div>
  
          <div className="mb-4">
            <Label htmlFor="locationId" className="block text-gray-700 text-sm font-bold mb-2">Sucursal:</Label>
            {locationsLoading ? (
              <p>Cargando sucursales...</p>
            ) : locationsError ? (
              <p className="text-red-500 text-sm">{locationsError}</p>
            ) : (
              <select
                id="locationId"
                className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
                value={selectedLocationId === null ? '' : selectedLocationId}
                onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                required
              >
                <option value="">Seleccionar sucursal</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.location})
                  </option>
                ))}
              </select>
            )}
          </div>
  
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
              {loading ? 'Actualizando...' : 'Guardar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
};

export default AddEmployee;
