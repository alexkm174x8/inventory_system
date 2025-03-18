"use client"

import React, { useState } from 'react';
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { MinusIcon, PlusIcon, ImageIcon, ArrowLeft } from "lucide-react"

interface Attribute {
  name: string;
  options: string[];
}

interface CreateProductViewProps {
  onClose: () => void;
}

const CreateProductView: React.FC<CreateProductViewProps> = ({ onClose }) => {
  const [productImage, setProductImage] = useState<string | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([
    { name: '', options: [''] }
  ])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setProductImage(imageUrl)
    }
  }

  const handleAttributeNameChange = (index: number, value: string) => {
    const newAttributes = [...attributes]
    newAttributes[index].name = value
    setAttributes(newAttributes)
  }

  const handleOptionChange = (attrIndex: number, optionIndex: number, value: string) => {
    const newAttributes = [...attributes]
    newAttributes[attrIndex].options[optionIndex] = value
    setAttributes(newAttributes)
  }

  const addOption = (attrIndex: number) => {
    const newAttributes = [...attributes]
    newAttributes[attrIndex].options.push('')
    setAttributes(newAttributes)
  }

  const addAttribute = () => {
    setAttributes([...attributes, { name: '', options: [''] }])
  }

  return (
    <div className="h-full">
      <button 
        onClick={onClose}
        className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inventario
      </button>

      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6">
          {/* Header and Image Upload */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <h1 className="text-2xl font-bold">Nuevo Producto</h1>
            <div className="flex flex-col items-center">
              <div className="border border-dashed border-gray-300 rounded w-24 h-24 flex flex-col items-center justify-center cursor-pointer relative">
                {productImage ? (
                  <Image
                    src={productImage}
                    alt="Product image"
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400 text-center">
                      Arrastra la imagen
                      <br />o
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
              </div>
              <button className="text-blue-500 text-sm mt-2">Buscar Imagen</button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre</Label>
              <Input id="product-name" placeholder="Nombre del producto" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-price">Precio unitario</Label>
              <div className="relative">
                <Input id="unit-price" placeholder="Precio del producto" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  MXN
                </div>
              </div>
            </div>

            {/* Attributes Section */}
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
                    <div key={optionIndex} className="space-y-2">
                      <Label htmlFor={`option-${attrIndex}-${optionIndex}`}>
                        Opción {optionIndex + 1}
                      </Label>
                      <Input
                        id={`option-${attrIndex}-${optionIndex}`}
                        value={option}
                        onChange={(e) => handleOptionChange(attrIndex, optionIndex, e.target.value)}
                        placeholder="Ingresar la opción"
                      />
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
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProductView; 