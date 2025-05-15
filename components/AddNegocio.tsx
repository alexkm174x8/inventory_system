'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {Card, CardContent} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getUserId } from '@/lib/userId';

interface AddNegocioProps {
  onClose: () => void;
  onNegocioAdded: () => void;
}

interface  Negocio {
    id: number;
    name: string;
    billingDay: number;
    billingAmount: string;
  }

const AddNegocio: React.FC<AddNegocioProps> = ({ onClose, onNegocioAdded }) => {
  const [name, setName] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [billingAmount, setBillingAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    billingDay?: string;
    billingAmount?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    let isValid = true;
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
      isValid = false;
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name)) {
      newErrors.name = 'El nombre solo puede contener letras (incluyendo acentos) y espacios';
      isValid = false;
    }

    if (!billingDay.trim()) {
      newErrors.billingDay = 'El día de cobro es obligatorio';
      isValid = false;
    } else if (isNaN(parseFloat(billingDay))) {
      newErrors.billingDay = 'El día de cobro debe ser un número';
      isValid = false;
    }

    if (!billingAmount.trim()) {
        newErrors.billingAmount = 'El monto de cobro es obligatiorio ';
        isValid = false;
      } else if (isNaN(parseFloat(billingAmount))) {
        newErrors.billingDay = 'El monto de cobro cobro debe ser un número';
        isValid = false;
      }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return; 
    }

    setLoading(true);
    
    try {
      const userId = await getUserId();

      const { error } = await supabase
        .from('admins')
        .insert([
          {
            name,
            billing_day: parseInt(billingDay),
            billing_amount: parseFloat(billingAmount),
            user_id: userId,
          },
        ]);

      if (error) {
        throw error;
      }

      console.log('Empleado agregado exitosamente');
      setLoading(false);
      onNegocioAdded();
      onClose();
     
    } catch (err: any) {
      console.error('Error al agregar empleado:', err);
      setErrors({ general: err.message }); 
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="h-full">
         <Card className="w-full">
           <CardContent className="p-6">
               <h1 className="text-lg font-semibold capitalize">Agregar empleado</h1>

          <div className="mb-4">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Nombre del empleado"
              onChange={(e) => setName(e.target.value)}
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <Label htmlFor="email">Cobro mensual</Label>
            <Input
              id="cobro"
              type="number"
              className={`mt-1 ${errors.billingAmount ? 'border-red-500' : ''}`}
              value={billingAmount}
              placeholder="Monto de cobro mensula"
              onChange={(e) => setBillingAmount(e.target.value)}
              required
            />
            {errors.billingAmount && <p className="text-red-500 text-xs mt-1">{errors.billingAmount}</p>}
          </div>

          <div className="mb-4">
            <Label htmlFor="salary">Fecha de cobro</Label>
            <Input
              id="billing-day"
              type="date"
              className={`mt-1 ${errors.billingDay ? 'border-red-500' : ''}`}
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              required
            />
            {errors.billingDay && <p className="text-red-500 text-xs mt-1">{errors.billingDay}</p>}
          </div>

          

          {errors.general && <p className="text-red-500 text-xs mt-2">{errors.general}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
              {loading ? 'Guardar' : 'Guardar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

export default AddNegocio;
