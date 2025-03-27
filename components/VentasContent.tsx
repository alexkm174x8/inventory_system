// VentasContent.tsx
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import LoginLogo from './login-logo';
import CheckoutVenta from './CheckoutVenta';
import VentaViewDetails from './VentaViewDetails'

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

const VentasContent: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [showCheckoutVenta, setShowCheckoutVenta] = useState(false);
  const [ventaDetails, setVentaDetails] = useState<Venta | null>(null);

  // Cargar ventas desde localStorage
  useEffect(() => {
    const ventasGuardadas = localStorage.getItem("ventas");
    if (ventasGuardadas) {
      setVentas(JSON.parse(ventasGuardadas));
    }
  }, []);

  // Función para actualizar la lista de ventas (por ejemplo, luego de cerrar CheckoutVenta)
  const updateVentas = () => {
    const ventasGuardadas = localStorage.getItem("ventas");
    if (ventasGuardadas) {
      setVentas(JSON.parse(ventasGuardadas));
    }
  };

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      {/* Renderizado condicional de los componentes: */}
      {showCheckoutVenta && (
        <CheckoutVenta 
          onClose={() => {
            setShowCheckoutVenta(false);
            updateVentas();
          }}
        />
      )}

      {ventaDetails && (
        <VentaViewDetails 
          venta={ventaDetails} 
          onClose={() => setVentaDetails(null)}
        />
      )}

      {(!showCheckoutVenta && !ventaDetails) && (
        <>
          <div className="mb-6">
            {/* Botón para crear una nueva venta */}
            <button 
              onClick={() => setShowCheckoutVenta(true)}
              className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg'
            >
              <Plus className="w-4 h-4" />
              Crear venta
            </button>
            
          </div>
          <div className="grid grid-cols-1 justify-items-center md:grid-cols-2  lg:grid-cols-3 xl:grid-cols-3 gap-4 ">
            {ventas.length === 0 ? (
              <p>No hay ventas registradas</p>
            ) : (
              ventas.map((venta) => {
                const fecha = new Date(venta.createdAt);
                return (
                  <div 
                    key={venta.id} 
                    className="relative flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg w-full"
                  >
                    <div className="mx-3 mb-0 border-b border-slate-200 pt-3 pb-2 px-1">
                      <div className="flex items-center gap-3">
                        <LoginLogo size={60} />
                        <div>
                          <h2 className="text-lg font-semibold">Venta #{venta.id}</h2>
                          <p className="font-light text-sm mt-2">Cliente: Público en general</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <p>{fecha.toLocaleDateString()}</p>
                        <p>{fecha.toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between text-gray-400 pb-3">
                        <span>Cantidad</span>
                        <span>Producto</span>
                        <span>Precio</span>
                      </div>
                      <ul className="text-slate-600 font-light">
                        {venta.items.map((producto, index) => (
                          <li key={index} className="flex justify-between py-1">
                            <span>{producto.quantity}</span>
                            <span>{producto.name}</span>
                            <span>${producto.unitPrice * producto.quantity} MXN</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mx-3 border-t border-slate-200 pb-3 pt-2 px-1 flex justify-between items-center">
                      <p className="text-sm text-slate-600 font-medium">Total: ${venta.total} MXN</p>
                      <button 
                        onClick={() => setVentaDetails(venta)}
                        className="text-blue-600 text-sm font-medium"
                      >
                        Ver más
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default VentasContent;

