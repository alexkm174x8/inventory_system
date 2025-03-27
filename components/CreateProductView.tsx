"use client"

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, Trash2 } from "lucide-react";
import { getUserId } from '@/lib/userId';
import { supabase } from '@/lib/supabase';

interface Attribute {
  name: string;
  options: string[];
}

export interface Product {
  name: string;
  unitPrice: number;
  image: string | null;
  attributes: Attribute[];
}

interface CreateProductViewProps {
  onSaveProduct: (product: Product) => void;  
  onClose: () => void;
}

const CreateProductView: React.FC<CreateProductViewProps> = ({ onSaveProduct, onClose }) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [attributes, setAttributes] = useState<Attribute[]>([{ name: '', options: [''] }]);

  const handleSaveProduct = async () => {
    if (!productName || !unitPrice) {
      alert('Por favor complete todos los campos.');
      return;
    }
  
    try {
      const insertedId = await insertProduct(); // Insert product and get ID
      if (!insertedId) {
        console.error("No se pudo obtener el ID del producto");
        return;
      }
  
      const insertedChar = await insertAttribute(insertedId);
      await insertOptions(insertedChar); // Insert options
  
      // Update local state
      onSaveProduct({
        name: productName,
        unitPrice: parseFloat(unitPrice.toString()),
        image: productImage,
        attributes: attributes,
      });
  
      console.log("Producto guardado con éxito");
  
      // Clear form
      setProductName('');
      setUnitPrice('');
      setProductImage(null);
      setAttributes([{ name: '', options: [''] }]);
      onClose();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Formato no permitido. Usa PNG o JPG ");
      return;
    }
  
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo supera los 10MB permitidos.");
      return;
    }
    setFileName(file.name);
    const imageUrl = URL.createObjectURL(file);
    setProductImage(imageUrl);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const processFile = (file: File) => {
    setProductImage(URL.createObjectURL(file));
    setFileName(file.name);
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const removeOption = (attrIndex: number, optionIndex: number) => {
    setAttributes((prev) =>
      prev.map((attr, i) =>
        i === attrIndex
          ? { ...attr, options: attr.options.filter((_, j) => j !== optionIndex) }
          : attr
      )
    );
  };

  const handleAttributeNameChange = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index].name = value;
    setAttributes(newAttributes);
  };

  const handleOptionChange = (attrIndex: number, optionIndex: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].options[optionIndex] = value;
    setAttributes(newAttributes);
  };

  const addOption = (attrIndex: number) => {
    const newAttributes = [...attributes];
    newAttributes[attrIndex].options.push('');
    setAttributes(newAttributes);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', options: [''] }]);
  };

  const [insertedId, setInsertedId] = useState(null);

  async function insertProduct() {
    try {
      const userId = await getUserId();
      console.log("Este es el userId: ", userId)
      const { data, error } = await supabase
        .from('inventory')
        .insert([{ user_id: userId, name: productName, description: '', price: unitPrice }])
        .select('id');
  
      if (error) throw error;
  
      return data?.[0]?.id;
    } catch (error) {
      console.error('Error inserting product:', error);
    }
  }
  
  async function insertAttribute(productId: number) {
    try {
      const { data, error } = await supabase
        .from('product_characteristics')
        .insert(attributes.map((attribute) => ({
          product_id: productId,
          name: attribute.name,
        })))
        .select('characteristics_id');
  
      if (error) throw error;
      console.log(data?.[0]?.characteristics_id)
      return data?.[0]?.characteristics_id;
    } catch (error) {
      console.error('Error inserting attributes:', error);
    }
  }
  
  async function insertOptions(productId: number) {
    try {
      const { error } = await supabase
        .from('characteristics_options')
        .insert(
          attributes.flatMap((attribute) =>
            attribute.options.map((option) => ({
              characteristics_id: productId,
              values: option,
            }))
          )
        );
  
      if (error) throw error;
    } catch (error) {
      console.error('Error inserting options:', error);
    }
  }
  

  return (
    <div className="h-full">
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6 ">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <h1 className="text-2xl font-bold">Nuevo Producto</h1>
          </div>
          <div
            className={`mt-4 flex-col items-center rounded-lg border border-dashed py-8 cursor-pointer transition-all ${
              isDragging ? "border-blue-500 bg-blue-100" : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <div className="text-center">
              {productImage ? (
                <div className="flex flex-col items-center">
                  <img
                    src={productImage}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded mb-2"
                  />
                  <p className="text-sm text-gray-500">{fileName}</p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="destructive" onClick={() => setProductImage(null)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto size-12 text-gray-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <label className="cursor-pointer">
                    <span className="text-blue-500 text-sm mt-2">Sube la imagen</span>
                    <span className="text-sm text-gray-400 text-center">
                      o Arrastra la imagen
                    </span>
                    <p className="text-xs text-gray-600">PNG, JPG, hasta 10MB</p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre</Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-price">Precio unitario</Label>
              <div className="relative">
                <Input
                  id="unit-price"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="Precio del producto"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  MXN
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {attributes.map((attribute, attrIndex) => (
                <div key={attrIndex} className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor={`attribute-${attrIndex}`}>
                      Nombre del atributo {attrIndex + 1}
                    </Label>
                    <Input
                      id={`attribute-${attrIndex}`}
                      value={attribute.name}
                      onChange={(e) => handleAttributeNameChange(attrIndex, e.target.value)}
                      placeholder="Nombre del atributo"
                    />
                  </div>

                  {attribute.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <div className="space-y-2 w-full">
                        <Label htmlFor={`option-${attrIndex}-${optionIndex}`}>
                          Opción {optionIndex + 1}
                        </Label>
                        <Input
                          id={`option-${attrIndex}-${optionIndex}`}
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(attrIndex, optionIndex, e.target.value)
                          }
                          placeholder="Ingresar la opción"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeOption(attrIndex, optionIndex)}
                        className="ml-2 mt-5"
                      >
                        <Trash2 className="text-red-600" /> 
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addOption(attrIndex)}
                    className="w-full"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Agregar opción
                  </Button>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeAttribute(attrIndex)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar atributo
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addAttribute}
                className="w-full"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Agregar atributo
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline" type="button" onClick={onClose}>
              Descartar
            </Button>
            <Button type="button" onClick={handleSaveProduct} className="bg-blue-500 hover:bg-blue-600">
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProductView;


