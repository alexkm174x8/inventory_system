import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface StockRecord {
  productName: string;
  quantity: number;
  entryDate: string;
}

export interface Product {
  name: string;
  unitPrice: number;
  image: string | null;
  attributes: { name: string; options: string[] }[];
  caracteristicas?: string[];
}

interface ProductDetailViewProps {
  product: StockRecord & Product;
  onClose: () => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, onClose }) => {
  const displayAttributes = React.useMemo(() => {
    if (product.attributes && product.attributes.length > 0) {
      return product.attributes;
    }
    
    if (product.caracteristicas && product.caracteristicas.length > 0) {
      const formattedAttributes: { name: string; options: string[] }[] = [];
      
      product.caracteristicas.forEach(char => {
        if (char.includes(':')) {
          const [name, value] = char.split(':').map(s => s.trim());
          
          const existingAttr = formattedAttributes.find(attr => attr.name === name);
          
          if (existingAttr) {
            existingAttr.options.push(value);
          } else {
            formattedAttributes.push({
              name: name,
              options: [value]
            });
          }
        }
      });
      
      return formattedAttributes;
    }
    
    return [];
  }, [product.attributes, product.caracteristicas]);

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
            <h1 className="text-2xl font-bold">Producto {product.name}</h1>
            <p className="text-lg font-light">MXN ${product.unitPrice}</p>
          </div>

          <div className="mt-3">
            <h2 className="text-base font-semibold">Detalles principales</h2>
            <div className="flex items-center justify-between">
              <span>ID</span>
              <span className="text-gray-500">#P345</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Nombre</span>
              <span className="text-gray-500">{product.name}</span>
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-base font-semibold">Características</h2>
            {displayAttributes.length > 0 ? (
              displayAttributes.map((attr, index) => (
                <div key={index} className="border-b py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{attr.name}</span>
                    <span className="text-gray-500">
                      {Array.isArray(attr.options) ? attr.options.join(", ") : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2">
                {product.caracteristicas && product.caracteristicas.length > 0 ? (
                  product.caracteristicas.map((char, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b py-1">
                      <span className="text-gray-500">{char}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No hay características para este producto.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3">
            <h2 className="text-base font-semibold">Detalles de Stock</h2>
            <div className="flex items-center justify-between">
              <span>Cantidad en Inventario</span>
              <span className="text-gray-500">{product.quantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fecha de entrada</span>
              <span className="text-gray-500">{product.entryDate}</span>
            </div>
          </div>

          {product.image && (
            <div className="mt-3">
              <h2 className="text-base font-semibold">Imagen del producto</h2>
              <div className="mt-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-32 h-32 object-cover rounded border border-gray-200"
                />
              </div>
            </div>
          )}

          <div className="text-center mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-20">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailView;