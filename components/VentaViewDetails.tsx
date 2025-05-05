import React from 'react';
import { Button } from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card"

interface Venta {
  id: string;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    attributes?: Record<string, string>; 
  }[];
  discount: number;
  subtotal: number;
  total: number;
  locationId?: number;
  locationName?: string;
  clientId?: number | null;
  clientName?: string;
}

interface VentaViewDetailsProps {
  venta: Venta;
  onClose: () => void;
}

const VentaViewDetails: React.FC<VentaViewDetailsProps> = ({ venta, onClose }) => {
  const fecha = new Date(venta.createdAt);
  const formatItemWithAttributes = (item: Venta['items'][0]) => {
    if (!item.attributes || Object.keys(item.attributes).length === 0) {
      return item.name;
    }
    
    const attributesList = Object.entries(item.attributes).map(([key, value]) => (
      <span key={key} className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600 mr-1">
        {key}: {value}
      </span>
    ));
    
    return (
      <div>
        <div>{item.name}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {attributesList}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden">
        <CardContent>
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
                <h1 className="text-2xl font-bold">Venta</h1> 
                <p className="text-lg font-light flex items-center gap-2">
                  ID #{venta.id}
                </p>
            </div>
            <div className="mt-3 mb-3">
                <h2 className="text-base font-semibold">Detalles principales</h2> 
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p><strong>Fecha:</strong> {fecha.toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {fecha.toLocaleTimeString()}</p>
              {venta.locationName && (
                <p><strong>Ubicación:</strong> {venta.locationName}</p>
              )}
              <p><strong>Cliente:</strong> {venta.clientName || 'Sin cliente'}</p>
            </div>
            <div className="mt-3">
                <h2 className="text-base font-semibold">Productos</h2> 
                <ul className="mt-3">
                    {venta.items.map((item, index) => (
                    <li key={index} className="flex justify-between border-b py-1">
                        <div className="flex">
                          <span className="mr-2">{item.quantity} x</span>
                          <div>{formatItemWithAttributes(item)}</div>
                        </div>
                        <span className="ml-auto">MXN ${item.unitPrice * item.quantity}</span>
                    </li>
                    ))}
                </ul>
            </div>
            <div className="mt-3 mb-3">
                <p><strong>Subtotal:</strong> MXN ${venta.subtotal}</p>
                <p><strong>Descuento:</strong> {venta.discount}%</p>
            </div>
            <div>
                <p><strong>Total:</strong> MXN ${venta.total}</p>
            </div>
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

export default VentaViewDetails;