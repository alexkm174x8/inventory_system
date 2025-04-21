"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface Product {
  name: string;
  unitPrice: number;
  image: string | null;
  attributes: any; 
}

export interface StockRecord {
  productName: string;
  quantity: number;
  entryDate: string;
}

interface AddProductToStockProps {
  products: Product[];
  onSaveStock: (stock: StockRecord) => void;
  onClose: () => void;
}

const AddProductToStock: React.FC<AddProductToStockProps> = ({ products, onSaveStock, onClose }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>(products.length > 0 ? products[0].name : "");
  const [quantity, setQuantity] = useState<number | string>('');
  const [entryDate, setEntryDate] = useState<string>('');

  const handleSaveStock = () => {
    if (!selectedProduct || !quantity || !entryDate ) {
      alert("Por favor completa todos los campos.");
      return;
    }
    
    const newStock: StockRecord = {
      productName: selectedProduct,
      quantity: parseInt(quantity.toString(), 10),
      entryDate: entryDate,
    };
  
    onSaveStock(newStock);
  
    // Limpiar formulario
    setQuantity('');
    setEntryDate('');
    onClose();
  };

  return (
    <div className="h-full">
      <Card className="w-full">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Agregar Inventario</h1>

          {/* Seleccionar Producto */}
          <div className="mb-4">
            <Label htmlFor="product-select">Producto</Label>
            <select
              id="product-select"
              className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              {products.map((product, index) => (
                <option key={index} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <Label htmlFor="quantity">Cantidad a agregar</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Cantidad"
              className="mt-1"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="entry-date">Fecha de entrada</Label>
            <Input
              id="entry-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="mt-1 text-[#737373]"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveStock} className="bg-blue-500 hover:bg-blue-600">
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductToStock;