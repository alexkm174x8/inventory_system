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
}

interface ProductDetailViewProps {
  product: StockRecord & Product;
  onClose: () => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product, onClose }) => {
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
            <h2 className="text-base font-semibold">Atributos</h2>
            {product.attributes.length > 0 ? (
              product.attributes.map((attr) => (
                <div key={attr.name} className="flex items-center justify-between border-b py-2">
                  <span className="font-semibold">{attr.name}</span>
                  <span className="text-gray-500">{attr.options.join(", ")}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No hay atributos para este producto.</p>
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
              <div className=" mt-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-35 h-35 object-cover rounded border border-black "
                />
              </div>
            </div>
          )}

          <div className="text-center">
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

