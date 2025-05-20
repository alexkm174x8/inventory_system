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
  const [clientDiscount, setClientDiscount] = useState('');
  const [clientSaldo, setClientSaldo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
      name?: string;
      phone?: string;
      discount?: string;
      saldo?: string;
      general?: string;
    }>({});

  const validateForm = () => {
    let isValid = true;
    const newErrors: typeof errors = {};

    if (!clientName.trim()) {
      newErrors.name = 'El nombre es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(clientName)) {
      newErrors.name =
        'El nombre solo puede contener letras y espacios';
      isValid = false;
    } else if (clientName.length > 50) {
      newErrors.name = 'El nombre no puede exceder los 50 caracteres';
      isValid = false;
    }

    if (!clientPhone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
      isValid = false;
    } else if (isNaN(parseInt(clientPhone))) {
      newErrors.phone = 'El teléfono debe ser un número';
      isValid = false;
    } else if (clientPhone.length > 15) {
      newErrors.phone = 'El teléfono no puede exceder los 15 caracteres';
      isValid = false;
    }

    if (clientDiscount && (isNaN(parseFloat(clientDiscount)) || parseFloat(clientDiscount) < 0 || parseFloat(clientDiscount) > 100)) {
      newErrors.discount = 'El descuento debe ser un número entre 0 y 100';
      isValid = false;
    }

    if (clientSaldo && isNaN(parseFloat(clientSaldo))) {
      newErrors.saldo = 'El saldo debe ser un número válido';
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
        .from('clients')
        .insert([
          {
            name: clientName,
            phone: clientPhone,
            discount: clientDiscount ? parseFloat(clientDiscount) : 0,
            saldo: clientSaldo ? parseFloat(clientSaldo) : 0,
            num_compras: 0,
            total_compras: 0,
            user_id: userId,
        }])

      if (error)
        throw error

      onSave();
    } catch (err) {
      console.error(err);
      setErrors(prev => ({
        ...prev,
        general: 'Error al guardar el cliente',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <Card className="w-full">
        <CardContent className="p-6">
            <h1 className="text-lg font-semibold capitalize">Agregar nuevo cliente</h1>
            <div className="my-4">
                <Label htmlFor="clientName">Nombre</Label>
                <Input
                    id="clientName"
                    className={`mt-1 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    value={clientName}
                    placeholder="Agregue el nombre del cliente"
                    onChange={(e) => setClientnName(e.target.value)}
                    maxLength={50}
                />
                {errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.name}
              </p>
            )}
            </div>
            <div className="mb-4">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                    id="phone"
                    className={`mt-1 ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Agregue el número del cliente"
                    maxLength={15}
                />
                {errors.phone && (
             <p className="text-red-500 text-xs mt-1">
                {errors.phone}
              </p>
            )}
            </div>
            <div className="mb-4">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={`mt-1 ${
                      errors.discount ? 'border-red-500' : ''
                    }`}
                    value={clientDiscount}
                    onChange={(e) => setClientDiscount(e.target.value)}
                    placeholder="Descuento por defecto (0-100%)"
                />
                {errors.discount && (
             <p className="text-red-500 text-xs mt-1">
                {errors.discount}
              </p>
            )}
            </div>
            <div className="mb-4">
              <Label htmlFor="saldo">Saldo Inicial</Label>
              <Input
                id="saldo"
                type="number"
                step="0.01"
                className={`mt-1 ${
                  errors.saldo ? 'border-red-500' : ''
                }`}
                value={clientSaldo}
                onChange={(e) => setClientSaldo(e.target.value)}
                placeholder="Saldo inicial del cliente (puede ser negativo)"
              />
              {errors.saldo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.saldo}
                </p>
              )}
            </div>
            {errors.general && (
            <p className="text-red-500 text-xs mt-2">
              {errors.general}
            </p>
          )}
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