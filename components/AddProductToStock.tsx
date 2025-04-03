"use client";

import React, { use, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

export interface Product {
  id: number;  // Assuming this is the id from your database
  name: string;
  unitPrice?: number;  // Optional properties if they may not be included in the fetched data
  image?: string | null;
  attributes?: any;
}

export interface Attributes {
  characteristics_id?: number;
  name: string;
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
  const [additionalField, setAdditionalField] = useState<string | null>(null); // New state for additional field
  const [productId, setProductId] = useState<number | null>(null); // State to store the selected product's ID

  const handleSaveStock = () => {
    if (!selectedProduct || !quantity || !entryDate) {
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
    setAdditionalField(null); // Reset additional field
    onClose();
  };

  const [product, setProduct] = useState<Product[] | string>('Cargando...');
  const [attributes, setAttributes] = useState<Attributes[]>([]);

  const [attributeCount, setAttributeCount] = useState<number>(0);
  const [attributeOptions, setAttributeOptions] = useState<{ [key: number]: string[] }>({});

  useEffect(() => {
    async function getProducts() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.id) {
          const userId = await getUserId();

          const { data: products, error } = await supabase
            .from('products')
            .select('id, name')
            .eq('user_id', userId);

          if (error) {
            console.error('Error details:', error);
            return;
          }

          setProduct(products);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    }

    // Function to check if the selected product id exists in the other table
    async function checkAdditionalField(productId: number) {
      if (productId) {
        const { data: additionalData, error } = await supabase
          .from('product_characteristics') // Replace with the table you want to check
          .select('characteristics_id')
          .eq('product_id', productId); // Modify based on your actual field and table structure

        if (additionalData && additionalData.length > 0) {
          setAdditionalField('Atributos');
        } else {
          setAdditionalField(null);
        }
      }
    }

    getProducts();
    
    if (productId) {
      checkAdditionalField(productId); // Trigger check when productId is set
    }
  }, [supabase, productId]); // Re-run when productId is updated

  useEffect(() => {
    async function getAttributes(productId: number | null) {
      if (productId === null) {
        console.log("No product_id provided, skipping fetch.");
        return;
      }
  
      try {
        const { data, error } = await supabase
          .from("product_characteristics")
          .select("characteristics_id, name")
          .eq("product_id", productId);
  
        if (error) throw error;
  
        setAttributes(data || []); // First update attributes
      } catch (error) {
        console.error("Error fetching attributes:", error);
      }
    }
  
    if (productId !== null) {
      getAttributes(productId);
    }
  }, [productId]); // Runs only when productId changes
  
  // NEW useEffect to fetch options AFTER attributes are set
  useEffect(() => {
    async function getAttributeOptions() {
      try {
        let optionsMap: { [key: number]: string[] } = {};
  
        for (const attribute of attributes) {
          if (!attribute.characteristics_id) {
            console.warn(`Skipping attribute ${attribute.name} because it has no characteristics_id`);
            continue;
          }
  
          const { data, error } = await supabase
            .from("characteristics_options")
            .select("values")
            .eq("characteristics_id", attribute.characteristics_id);
  
          if (error) {
            console.error(`Error fetching options for ${attribute.name}:`, error);
            continue;
          }
  
          // Extract values from the data and store them in the map
          const values = data.map((option) => option.values);
          optionsMap[attribute.characteristics_id] = values;
          
          // Add some debugging to verify the data is correct
          console.log(`Options for ${attribute.name} (ID: ${attribute.characteristics_id}):`, values);
        }
  
        setAttributeOptions(optionsMap);
        console.log("Final options map:", optionsMap);
      } catch (error) {
        console.error("Unexpected error fetching attribute options:", error);
      }
    }
  
    if (attributes.length > 0) {
      getAttributeOptions();
    }
  }, [attributes]);
  
  useEffect(() => {
    // When selectedProduct changes, find its id and check the other table
    if (product && Array.isArray(product)) {
      const selected = product.find(p => p.name === selectedProduct);
      if (selected) {
        setProductId(selected.id);
      }
    }
  }, [selectedProduct, product]);

  if (typeof product === 'string') {
    return <div>{product}</div>;  // Display loading or error message
  }
  
  if (typeof attributes === 'string') {
    return <div>{attributes}</div>;  // Display loading or error message
  }

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
              {/* Empty default option */}
              <option value="" disabled>
                Selecciona un producto
              </option>

              {product.map((product, index) => (
                <option key={index} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {attributes.length > 0 && (
  <div className="mb-4">
    {attributes.map((attribute) => {
      // Make sure we have a valid characteristics_id
      if (!attribute.characteristics_id) return null;
      
      // Get options specific to this attribute's characteristics_id
      const options = attributeOptions[attribute.characteristics_id] || [];

      return (
        <div key={attribute.characteristics_id} className="mb-2">
          <Label htmlFor={`attribute-${attribute.characteristics_id}`}>
            {attribute.name}
          </Label>
          <select
            id={`attribute-${attribute.characteristics_id}`}
            className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {options.length > 0 ? (
              options.map((option, optIndex) => (
                <option key={optIndex} value={option}>
                  {option}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No hay opciones disponibles
              </option>
            )}
          </select>
        </div>
      );
    })}
  </div>
)}

          {/* Cantidad */}
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

          {/* Fecha de Entrada */}
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