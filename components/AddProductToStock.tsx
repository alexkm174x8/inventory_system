"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

// --- Interfaces (Añadimos Ubicacion y OptionData) ---
export interface Product {
  id: number;
  name: string;
}

export interface Attribute {
  characteristics_id: number; // Asegurarse que siempre esté presente al usarlo
  name: string;
}

// Para guardar la información de las opciones recuperadas
export interface OptionData { // <-- CAMBIO: Necesitamos ID y Valor de la opción
  id: number;
  value: string;
}

// Para guardar la información de las ubicaciones
export interface Ubicacion { // <-- NUEVA: Para la tabla Ubicaciones
  id: number;
  name: string;
}

// Interfaz para lo que realmente guardaremos (no necesario pasarla como prop)
// interface StockRecord {
//  productName: string; // Ya no usaremos esto directamente
//  quantity: number;
//  entryDate: string; // Puedes mantenerlo si quieres registrar la fecha de entrada en 'stock'
// }

interface AddProductToStockProps {
  
  onSaveStock: () => void; // <-- CAMBIO: Ya no pasa StockRecord simple
  onClose: () => void;
}

const AddProductToStock: React.FC<AddProductToStockProps> = ({ onSaveStock, onClose }) => {
  // --- Estados ---
  const [products, setProducts] = useState<Product[]>([]); // <-- CAMBIO: Carga productos aquí
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null); // <-- CAMBIO: Usamos ID
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<{ [key: number]: OptionData[] }>({}); // <-- CAMBIO: Guarda OptionData[]
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number | null }>({}); // <-- NUEVO: Guarda la opción seleccionada por atributo {charId: optionId}
  const [quantity, setQuantity] = useState<number | string>('');
  // const [entryDate, setEntryDate] = useState<string>(''); // Opcional
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]); // <-- NUEVO: Guarda ubicaciones
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null); // <-- NUEVO: Guarda ubicación seleccionada
  const [isLoading, setIsLoading] = useState(false); // <-- NUEVO: Para feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // <-- NUEVO: Para errores

  // --- Carga de Datos Inicial ---
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const userId = await getUserId();
        if (!userId) throw new Error("Usuario no autenticado.");
        // Cargar Productos
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('user_id', userId);
        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Cargar Ubicaciones (Ajusta el nombre de la tabla si es diferente)
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
  }, []); // Ejecutar solo una vez al montar

  // --- Carga de Atributos cuando cambia el Producto Seleccionado ---
  useEffect(() => {
    async function getAttributes(productId: number | null) {
      if (productId === null) {
        setAttributes([]);
        setAttributeOptions({});
        setSelectedOptions({}); // Limpiar selecciones previas
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
        // Limpiar opciones al cambiar de producto antes de cargar las nuevas
        setAttributeOptions({});
        setSelectedOptions({});
      } catch (error: any) {
        console.error("Error fetching attributes:", error);
        setErrorMsg(`Error cargando atributos: ${error.message}`);
        setAttributes([]); // Limpiar en caso de error
      } finally {
        setIsLoading(false);
      }
    }
    getAttributes(selectedProductId);
  }, [selectedProductId]);

  // --- Carga de Opciones cuando cambian los Atributos ---
  useEffect(() => {
    async function getAttributeOptions() {
      if (attributes.length === 0) {
        setAttributeOptions({}); // Asegurarse de limpiar si no hay atributos
        return;
      };

      setIsLoading(true);
      setErrorMsg(null); // Limpiar error previo
      try {
        let optionsMap: { [key: number]: OptionData[] } = {};
        const initialSelectedOptions: { [key: number]: number | null } = {};

        for (const attribute of attributes) {
          if (!attribute.characteristics_id) continue; // Saltar si falta id

          const { data, error } = await supabase
          .from("characteristics_options")
          .select("id, values") // <-- CAMBIO: Pedimos 'id' (option_id) además de 'values'
          .eq("characteristics_id", attribute.characteristics_id)

          if (error) {
            console.error(`Error fetching options for ${attribute.name}:`, error);
            setErrorMsg(`Error cargando opciones para ${attribute.name}.`); // Mostrar error específico
            optionsMap[attribute.characteristics_id] = []; // Poner array vacío si falla
            continue; // Continuar con el siguiente atributo
          }

          // Mapear a la interfaz OptionData
          const optionsData: OptionData[] = (data || []).map(opt => ({ id: opt.id, value: opt.values }));
          optionsMap[attribute.characteristics_id] = optionsData;
          initialSelectedOptions[attribute.characteristics_id] = null; // Inicializar selección
        }
        setAttributeOptions(optionsMap);
        setSelectedOptions(initialSelectedOptions); // Resetear selecciones al cargar nuevas opciones

      } catch (error: any) {
        console.error("Unexpected error fetching attribute options:", error);
        setErrorMsg(`Error inesperado cargando opciones: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    getAttributeOptions();
  }, [attributes]); // Ejecutar cuando cambie la lista de atributos


  // --- Handler para Cambios en Dropdowns de Opciones ---
  const handleOptionChange = (characteristicId: number, optionIdStr: string) => {
    const optionId = optionIdStr ? parseInt(optionIdStr, 10) : null;
    setSelectedOptions(prev => ({
      ...prev,
      [characteristicId]: optionId,
    }));
  };


  // --- Lógica Principal para Guardar Stock ---
  const handleSaveStock = async () => {
    setErrorMsg(null);
    setIsLoading(true);
 
    // 1. --- Validaciones ---
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
 
    // --- Iniciar Proceso de Guardado ---
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Usuario no autenticado.");

      let varianteId: number;
      const selectedOptionIds = Object.values(selectedOptions).filter(id => id !== null) as number[];

      const optionsArrayLiteral = `{${selectedOptionIds.join(',')}}`;
      console.log("Llamando RPC con p_option_ids como string literal:", optionsArrayLiteral);
 
      // 2. --- Buscar Variante Existente usando RPC ---
      console.log("Buscando variante existente...");
      const { data: rpcResult, error: searchError } = await supabase
        .rpc('find_variant_by_options', {
          p_user_id: userId,
          p_product_id: selectedProductId,
          p_option_ids: optionsArrayLiteral // <-- PASAMOS EL STRING '{36,38}'
        });
 
        if (searchError) {
          // Si sigue fallando, el problema podría estar en la definición SQL de la función RPC
          console.error("Error buscando variante via RPC:", searchError);
          throw new Error(`Error al buscar variante (RPC): ${searchError.message}. Verifica la función y el formato del array.`);
        }
 
      // Verificar si la RPC encontró algo
      const foundVariant = rpcResult && rpcResult.length > 0 ? rpcResult[0] : null;
 
      if (foundVariant && foundVariant.variant_id) {
        // --- 3a. Variante YA EXISTÍA ---
        varianteId = foundVariant.variant_id;
        console.log("Variante encontrada con ID:", varianteId);
 
      } else {
        // --- 3b. Variante NO EXISTÍA, hay que crearla ---
        console.log("Variante no encontrada, creando nueva variante...");
 
        // INSERTAR en 'producto_variantes' (ajusta el nombre si es diferente)
        const { data: newVariantData, error: variantInsertError } = await supabase
          .from('productVariants') // <-- VERIFICA ESTE NOMBRE DE TABLA
          .insert({
            product_id: selectedProductId,
            user_id: userId
            // ,sku: 'GENERAR_SKU_AQUI' // Opcional
          })
          .select('variant_id') // Pedir el ID generado
          .single(); // Esperamos solo una fila
 
        if (variantInsertError || !newVariantData?.variant_id) {
          throw new Error(`Error creando la nueva variante: ${variantInsertError?.message || 'No se obtuvo ID'}`);
        }
        varianteId = newVariantData.variant_id; // Guardar el ID recién creado
        console.log("Nueva variante creada con ID:", varianteId);
 
        // Si hay opciones seleccionadas, INSERTAR en 'variante_opciones'
        if (selectedOptionIds.length > 0) {
          const varianteOpcionesPayload = selectedOptionIds.map(optId => ({
            variant_id: varianteId,
            option_id: optId,
          }));
 
          console.log("Vinculando opciones:", varianteOpcionesPayload);
          const { error: optionsInsertError } = await supabase
            .from('optionVariants') // <-- VERIFICA ESTE NOMBRE DE TABLA
            .insert(varianteOpcionesPayload);
 
          if (optionsInsertError) {
            // Error crítico: Se creó la variante pero no se pudieron vincular las opciones.
            // Intentar borrar la variante huérfana (Rollback manual simple)
            console.error("Error vinculando opciones, intentando eliminar variante huérfana...");
            await supabase.from('producto_variantes').delete().eq('variant_id', varianteId);
            throw new Error(`Error vinculando opciones: ${optionsInsertError.message}`);
          }
          console.log("Opciones vinculadas correctamente.");
        } else {
           console.log("Producto sin opciones, no se inserta en variante_opciones.");
        }
      } // Fin de la creación de la variante
 
      // --- 4. Actualizar o Insertar en la tabla 'stock' ---
      // Ahora ya tenemos el 'varianteId' correcto (sea existente o nuevo)
 
      console.log(`Gestionando stock para variante ID: ${varianteId}, ubicación ID: ${selectedLocationId}`);
 
      // Buscar si ya existe una fila de stock para esta variante y ubicación
      const { data: stockCheck, error: stockCheckError } = await supabase
        .from('stock') // <-- VERIFICA ESTE NOMBRE DE TABLA
        .select('id, stock')
        .eq('variant_id', varianteId)
        .eq('location', selectedLocationId)
        // .eq('user_id', userId) // Si añadiste user_id a stock, también filtra aquí
        .maybeSingle(); // Puede devolver una fila o null
 
      if (stockCheckError) {
        throw new Error(`Error al verificar stock existente: ${stockCheckError.message}`);
      }
 
      if (stockCheck && stockCheck.id) {
        // --- 4a. YA EXISTE Stock: Hacer UPDATE ---
        const currentStock = stockCheck.stock || 0;
        const newStockLevel = currentStock + quantityNum;
        console.log(`Actualizando stock existente (ID: ${stockCheck.id}) de ${currentStock} a ${newStockLevel}`);
 
        const { error: updateError } = await supabase
          .from('stock') // <-- VERIFICA ESTE NOMBRE DE TABLA
          .update({
            stock: newStockLevel,
            added_at: new Date().toISOString() // Actualizar fecha/hora
            // user_id: userId // Si tienes user_id en stock, puedes re-asegurarlo aquí aunque no debería cambiar
          })
          .eq('id', stockCheck.id); // Actualizar usando el ID de la fila de stock
 
        if (updateError) {
          throw new Error(`Error actualizando stock: ${updateError.message}`);
        }
        console.log("Stock actualizado.");
 
      } else {
        // --- 4b. NO EXISTE Stock: Hacer INSERT ---
        console.log("Insertando nuevo registro de stock.");
        const { error: insertError } = await supabase
          .from('stock') // <-- VERIFICA ESTE NOMBRE DE TABLA
          .insert({
            variant_id: varianteId,
            location: selectedLocationId,
            stock: quantityNum,
            user_id: userId, // <-- ¡ASEGÚRATE QUE TIENES ESTA COLUMNA 'user_id' EN TU TABLA 'stock'!
            added_at: new Date().toISOString()
          });
 
        if (insertError) {
          throw new Error(`Error insertando nuevo stock: ${insertError.message}`);
        }
        console.log("Nuevo stock insertado.");
      } // Fin del manejo de stock
 
      // --- 5. Éxito Final ---
      alert("Stock agregado correctamente!");
      onSaveStock(); // Notificar
      // Limpiar formulario
      setSelectedProductId(null); // Esto disparará los useEffect para limpiar atributos/opciones
      setQuantity('');
      // setEntryDate(''); // Si usas fecha
      setSelectedLocationId(null);
      onClose(); // Cerrar
 
    } catch (error: any) {
      console.error("Error detallado en handleSaveStock:", error);
      setErrorMsg(`Error al guardar: ${error.message}`);
      // No limpiar el formulario en caso de error para que el usuario pueda corregir
    } finally {
      setIsLoading(false); // Quitar estado de carga
    }
  }; // Fin de handleSaveStock


  // --- Renderizado ---
  return (
    <div className="h-full">
      <Card className="w-full">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Agregar Inventario</h1>

           {/* --- Selector de Producto --- */}
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

          {/* --- Selectores de Atributos/Opciones (si existen) --- */}
          {isLoading && attributes.length === 0 && selectedProductId && <div>Cargando atributos...</div>}
          {attributes.length > 0 && (
            <div className="mb-4 border p-4 rounded-md">
              <h2 className="font-semibold mb-2">Selecciona Opciones</h2>
              {attributes.map((attribute) => {
                if (!attribute.characteristics_id) return null; // Seguridad
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
                      value={currentSelection ?? ""} // Usar el estado para el valor
                      onChange={(e) => handleOptionChange(attribute.characteristics_id, e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        {isLoading && options.length === 0 ? "Cargando opciones..." : `Selecciona ${attribute.name}`}
                      </option>
                      {options.length > 0 ? (
                        options.map((option) => (
                          <option key={option.id} value={option.id}> {/* Valor es option.id */}
                            {option.value} {/* Texto es option.value */}
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

           {/* --- Selector de Ubicación --- */}
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

          {/* --- Cantidad --- */}
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
              min="1" // Añadir validación mínima en HTML
            />
          </div>

          {/* (Opcional) Fecha de Entrada - Quitar si no la guardas en 'stock' */}
          {/* <div className="mb-4">
             <Label htmlFor="entry-date">Fecha de entrada</Label>
             <Input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-1 text-[#737373]" disabled={isLoading} />
           </div> */}

           {/* --- Mensaje de Error --- */}
           {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

          {/* --- Botones --- */}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveStock} className="bg-blue-500 hover:bg-blue-600" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductToStock;