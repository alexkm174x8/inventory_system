"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

export interface Product {
  id: number;
  name: string;
}

export interface Attribute {
  characteristics_id: number; 
  name: string;
}

export interface OptionData { 
  id: number;
  value: string;
}

export interface Ubicacion { 
  id: number;
  name: string;
}

interface AddProductToStockProps {
  onSaveStock: () => void; 
  onClose: () => void;
}

const AddProductToStock: React.FC<AddProductToStockProps> = ({ onSaveStock, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]); 
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null); 
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<{ [key: number]: OptionData[] }>({}); 
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number | null }>({}); 
  const [quantity, setQuantity] = useState<number | string>('');
  const [price, setPrice] = useState<number | string>('');
  const [entryDate, setEntryDate] = useState<string>(''); 
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]); 
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null); 
  const [isLoading, setIsLoading] = useState(false); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null); 
  const [existingPrice, setExistingPrice] = useState<number | null>(null); 

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const userId = await getUserId();
        if (!userId) throw new Error("Usuario no autenticado.");
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('user_id', userId);
        if (productsError) throw productsError;
        setProducts(productsData || []);
        const { data: ubicacionesData, error: ubicacionesError } = await supabase
          .from('locations')
          .select('id, name') 
          .eq('user_id', userId);
        if (ubicacionesError) throw ubicacionesError;
        setUbicaciones(ubicacionesData || []);

      } catch (error: any) {
        console.error('Error cargando datos iniciales:', error);
        setErrorMsg(`Error cargando datos: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []); 
  
  useEffect(() => {
    async function getAttributes(productId: number | null) {
      if (productId === null) {
        setAttributes([]);
        setAttributeOptions({});
        setSelectedOptions({}); 
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("product_characteristics")
          .select("characteristics_id, name")
          .eq("product_id", productId);
        if (error) throw error;
        setAttributes(data || []);
        setAttributeOptions({});
        setSelectedOptions({});
      } catch (error: any) {
        console.error("Error fetching attributes:", error);
        setErrorMsg(`Error cargando atributos: ${error.message}`);
        setAttributes([]); 
      } finally {
        setIsLoading(false);
      }
    }
    getAttributes(selectedProductId);
  }, [selectedProductId]);

  useEffect(() => {
    async function getAttributeOptions() {
      if (attributes.length === 0) {
        setAttributeOptions({}); 
        return;
      };

      setIsLoading(true);
      setErrorMsg(null);
      try {
        let optionsMap: { [key: number]: OptionData[] } = {};
        const initialSelectedOptions: { [key: number]: number | null } = {};

        for (const attribute of attributes) {
          if (!attribute.characteristics_id) continue; 

          const { data, error } = await supabase
          .from("characteristics_options")
          .select("id, values") 
          .eq("characteristics_id", attribute.characteristics_id)

          if (error) {
            console.error(`Error fetching options for ${attribute.name}:`, error);
            setErrorMsg(`Error cargando opciones para ${attribute.name}.`); 
            optionsMap[attribute.characteristics_id] = []; 
            continue; 
          }
          const optionsData: OptionData[] = (data || []).map(opt => ({ id: opt.id, value: opt.values }));
          optionsMap[attribute.characteristics_id] = optionsData;
          initialSelectedOptions[attribute.characteristics_id] = null; 
        }
        setAttributeOptions(optionsMap);
        setSelectedOptions(initialSelectedOptions);

      } catch (error: any) {
        console.error("Unexpected error fetching attribute options:", error);
        setErrorMsg(`Error inesperado cargando opciones: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    getAttributeOptions();
  }, [attributes]);

  const handleOptionChange = (characteristicId: number, optionIdStr: string) => {
    const optionId = optionIdStr ? parseInt(optionIdStr, 10) : null;
    setSelectedOptions(prev => ({
      ...prev,
      [characteristicId]: optionId,
    }));
    setExistingPrice(null);
    
    checkExistingVariant();
  };
  const checkExistingVariant = async () => {
    if (!selectedProductId) return;
    
    const selectedOptionIds = Object.values(selectedOptions).filter(id => id !== null) as number[];
    if (selectedOptionIds.length === 0) return;
    if (attributes.length > 0 && selectedOptionIds.length !== attributes.length) return;
    
    setIsLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Usuario no autenticado.");

      const optionsArrayLiteral = `{${selectedOptionIds.join(',')}}`;
      
      const { data: rpcResult, error: searchError } = await supabase
        .rpc('find_variant_by_options', {
          p_user_id: userId,
          p_product_id: selectedProductId,
          p_option_ids: optionsArrayLiteral
        });
        
      if (searchError) {
        console.error("Error buscando variante:", searchError);
        return;
      }
      
      if (rpcResult && rpcResult.length > 0 && rpcResult[0].variant_id) {
        const varianteId = rpcResult[0].variant_id;
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('price')
          .eq('variant_id', varianteId)
          .eq('location', selectedLocationId || -1) 
          .maybeSingle();
          
        if (stockError) {
          console.error("Error buscando precio en stock:", stockError);
          return;
        }
        if (stockData && stockData.price) {
          setExistingPrice(stockData.price);
          setPrice(stockData.price);
        } else {
          setExistingPrice(null);
          setPrice(''); // Limpiar precio si no hay existente
        }
      } else {
        setExistingPrice(null);
        setPrice(''); // Limpiar precio si no existe la variante
      }
    } catch (error: any) {
      console.error("Error verificando variante existente:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (selectedLocationId) {
      checkExistingVariant();
    }
  }, [selectedLocationId]);
  const handleSaveStock = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    if (!selectedProductId) {
      setErrorMsg("Por favor, selecciona un producto.");
      setIsLoading(false);
      return;
    }
    const selectedOptionIds = Object.values(selectedOptions).filter(id => id !== null) as number[];
    if (attributes.length > 0 && selectedOptionIds.length !== attributes.length) {
      setErrorMsg("Por favor, selecciona una opción para cada atributo.");
      setIsLoading(false);
      return;
    }
    const quantityNum = parseInt(quantity.toString(), 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setErrorMsg("Por favor, ingresa una cantidad válida (mayor a 0).");
      setIsLoading(false);
      return;
    }
    if (!selectedLocationId) {
      setErrorMsg("Por favor, selecciona una ubicación.");
      setIsLoading(false);
      return;
    }
    const priceNum = parseFloat(price.toString());
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg("Por favor, ingresa un precio válido (mayor a 0).");
      setIsLoading(false);
      return;
    }
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Usuario no autenticado.");

      let varianteId: number;
      const selectedOptionIds = Object.values(selectedOptions).filter(id => id !== null) as number[];

      const optionsArrayLiteral = `{${selectedOptionIds.join(',')}}`;
      const { data: rpcResult, error: searchError } = await supabase
        .rpc('find_variant_by_options', {
          p_user_id: userId,
          p_product_id: selectedProductId,
          p_option_ids: optionsArrayLiteral 
        });
 
        if (searchError) {
          console.error("Error buscando variante via RPC:", searchError);
          throw new Error(`Error al buscar variante (RPC): ${searchError.message}. Verifica la función y el formato del array.`);
        }
 
      const foundVariant = rpcResult && rpcResult.length > 0 ? rpcResult[0] : null;
 
      if (foundVariant && foundVariant.variant_id) {
        varianteId = foundVariant.variant_id;
 
      } else {
        const { data: newVariantData, error: variantInsertError } = await supabase
          .from('productVariants') 
          .insert({
            product_id: selectedProductId,
            user_id: userId
          })
          .select('variant_id') 
          .single();
 
        if (variantInsertError || !newVariantData?.variant_id) {
          throw new Error(`Error creando la nueva variante: ${variantInsertError?.message || 'No se obtuvo ID'}`);
        }
        varianteId = newVariantData.variant_id; 
        if (selectedOptionIds.length > 0) {
          const varianteOpcionesPayload = selectedOptionIds.map(optId => ({
            variant_id: varianteId,
            option_id: optId,
          }));
 
          const { error: optionsInsertError } = await supabase
            .from('optionVariants') 
            .insert(varianteOpcionesPayload);
 
          if (optionsInsertError) {
            console.error("Error vinculando opciones, intentando eliminar variante huérfana...");
            await supabase.from('producto_variantes').delete().eq('variant_id', varianteId);
            throw new Error(`Error vinculando opciones: ${optionsInsertError.message}`);
          }
        } else {
           console.log("Producto sin opciones, no se inserta en variante_opciones.");
        }
      } 
      const { data: stockCheck, error: stockCheckError } = await supabase
        .from('stock') 
        .select('id, stock, price')
        .eq('variant_id', varianteId)
        .eq('location', selectedLocationId)
        .maybeSingle(); 
 
      if (stockCheckError) {
        throw new Error(`Error al verificar stock existente: ${stockCheckError.message}`);
      }
 
      if (stockCheck && stockCheck.id) {
        const currentStock = stockCheck.stock || 0;
        const newStockLevel = currentStock + quantityNum;

        const { error: updateError } = await supabase
          .from('stock')
          .update({
            stock: newStockLevel,
            ...(stockCheck.price ? {} : { price: priceNum }),
            added_at: new Date().toISOString()
          })
          .eq('id', stockCheck.id);
          
        if (updateError) {
          throw new Error(`Error actualizando stock: ${updateError.message}`);
        }
        console.log("Stock actualizado.");
 
      } else {
        console.log("Insertando nuevo registro de stock.");
        const { error: insertError } = await supabase
          .from('stock') 
          .insert({
            variant_id: varianteId,
            location: selectedLocationId,
            stock: quantityNum,
            price: priceNum, 
            user_id: userId, 
            added_at: new Date().toISOString()
          });
 
        if (insertError) {
          throw new Error(`Error insertando nuevo stock: ${insertError.message}`);
        }
        console.log("Nuevo stock insertado.");
      } 
      alert("Stock agregado correctamente!");
      onSaveStock();
      setSelectedProductId(null); 
      setQuantity('');
      setPrice('');
      setEntryDate('');
      setSelectedLocationId(null);
      onClose(); 
 
    } catch (error: any) {
      console.error("Error detallado en handleSaveStock:", error);
      setErrorMsg(`Error al guardar: ${error.message}`);
    } finally {
      setIsLoading(false); 
    }
  }; 
  return (
    <div>
      <Card className="w-full ">
        <CardContent className="p-6">
            <h1 className="text-2xl font-bold  capitalize mb-4">Agregar Inventario</h1>
          <div className="mb-4">
            <Label htmlFor="product-select">Producto</Label>
            <select
              id="product-select"
              className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
              value={selectedProductId ?? ""}
              onChange={(e) => setSelectedProductId(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? "Cargando productos..." : "Selecciona un producto"}
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          {isLoading && attributes.length === 0 && selectedProductId && <div>Cargando atributos...</div>}
          {attributes.length > 0 && (
            <div className="mb-4 border p-4 rounded-md">
              <h2 className="font-semibold mb-2">Selecciona Opciones</h2>
              {attributes.map((attribute) => {
                if (!attribute.characteristics_id) return null; 
                const options = attributeOptions[attribute.characteristics_id] || [];
                const currentSelection = selectedOptions[attribute.characteristics_id];

                return (
                  <div key={attribute.characteristics_id} className="mb-3">
                    <Label htmlFor={`attribute-${attribute.characteristics_id}`}>
                      {attribute.name}
                    </Label>
                    <select
                      id={`attribute-${attribute.characteristics_id}`}
                      className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
                      value={currentSelection ?? ""} 
                      onChange={(e) => handleOptionChange(attribute.characteristics_id, e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        {isLoading && options.length === 0 ? "Cargando opciones..." : `Selecciona ${attribute.name}`}
                      </option>
                      {options.length > 0 ? (
                        options.map((option) => (
                          <option key={option.id} value={option.id}> 
                            {option.value}
                          </option>
                        ))
                      ) : (
                        !isLoading && <option value="" disabled>No hay opciones</option>
                      )}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="location-select">Ubicación</Label>
            <select
              id="location-select"
              className="w-full border shadow-xs rounded-[8px] p-1.5 mt-1 text-[#737373]"
              value={selectedLocationId ?? ""}
              onChange={(e) => setSelectedLocationId(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={isLoading || ubicaciones.length === 0}
            >
              <option value="" disabled>
                {isLoading && ubicaciones.length === 0 ? "Cargando ubicaciones..." : "Selecciona una ubicación"}
              </option>
              {ubicaciones.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
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
              disabled={isLoading}
              min="1" 
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="price">
              {existingPrice !== null ? "Precio (valor existente)" : "Precio"}
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Precio del producto"
                className="mt-1"
                disabled={isLoading || existingPrice !== null} 
                min="0.01"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                MXN
              </div>
            </div>
            {existingPrice !== null && (
              <p className="text-sm text-blue-500 mt-1">
                Esta variante ya tiene un precio establecido de {existingPrice} MXN.
              </p>
            )}
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
          {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveStock} className="bg-blue-500 hover:bg-blue-600" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Guardar'}
            </Button>
          </div>
    </CardContent>
  </Card>
</div>
  );
};

export default AddProductToStock;