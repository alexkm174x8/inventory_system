'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import {Card, CardContent} from "@/components/ui/card"

interface AddClientProps{
  onClose: () => void;
  onSave: () => void;
}

const AddClient: React.FC<AddClientProps> = ({ onClose, onSave }) => {
  const [clientName, setClientnName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const userId = await getUserId();

      const { error } = await supabase
        .from('clients')
        .insert({
        name: clientName,
        phone: clientPhone,
        num_compras: 0,
        total_compras: 0,
        user_id: userId,
  });

      if (error) throw error;

      onSave(); 
    } catch (error) {
      console.error(error);
      alert('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <Card className="w-full">
        <CardContent className="p-6">
            <h1 className="text-2xl font-bold  capitalize mb-4">Agregar nuevo cliente</h1>
            <div className="mb-4">
                <Label htmlFor="clientName">Nombre</Label>
                <Input
                    id="clientName"
                    className="mt-1"
                    value={clientName}
                    placeholder="Agregue el nombre del cliente"
                    onChange={(e) => setClientnName(e.target.value )}
                />
            </div>
            <div>
                <Label htmlFor="phone">Número telefónico</Label>
                <Input
                    id="phone"
                    className="mt-1"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Agregue el número del cliente"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClient;