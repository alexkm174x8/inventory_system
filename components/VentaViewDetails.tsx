// VentaViewDetails.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card"

// Definir la interfaz de Venta (asegúrate de que coincida con la estructura que guardas)
interface Venta {
  id: string;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  discount: number;
  subtotal: number;
  total: number;
}

interface VentaViewDetailsProps {
  venta: Venta;
  onClose: () => void;
}

const VentaViewDetails: React.FC<VentaViewDetailsProps> = ({ venta, onClose }) => {
  const fecha = new Date(venta.createdAt);

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden">
        <CardContent>
            <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
                <h1 className="text-2xl font-bold">Detalle de Venta #{venta.id}</h1> 
            </div>
            <div className="mt-3 ">
                <h2 className="text-base font-semibold">Detalles principales</h2> 
                    <p><strong>Fecha:</strong> {fecha.toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> {fecha.toLocaleTimeString()}</p>
            </div>
            <div className="mt-3">
                <h2 className="text-base font-semibold">Productos</h2> 
                <ul className="mt-2">
                    {venta.items.map((item, index) => (
                    <li key={index} className="flex justify-between border-b py-1">
                        <span>{item.quantity} x {item.name}</span>
                        <span>MXN ${item.unitPrice * item.quantity}</span>
                    </li>
                    ))}
                </ul>
            </div>
            <div className="mt-4">
                <p><strong>Subtotal:</strong> MXN ${venta.subtotal}</p>
                <p><strong>Descuento:</strong> {venta.discount}%</p>
                <p className="font-bold"><strong>Total:</strong> MXN ${venta.total}</p>
            </div>
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

export default VentaViewDetails;
