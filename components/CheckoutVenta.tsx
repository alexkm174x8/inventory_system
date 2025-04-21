// CheckoutVenta.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Image, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Interfaces de datos
interface Producto {
  name: string;
  unitPrice: number;
  image: string | null;
  attributes: Record<string, any>;
}

interface ProductoCarrito extends Producto {
  quantity: number;
}

interface InventarioItem {
  productName: string;
  quantity: number;
  entryDate: string;
}

// Props del componente
interface CheckoutVentaProps {
  onClose: () => void;
}

// Datos de productos y stock
const productosVenta: Producto[] = [
  { name: "Pantalón azul marino", unitPrice: 30, image: null, attributes: {} },
  { name: "Pantalón azul claro", unitPrice: 40, image: null, attributes: {} },
  { name: "Pantalón verde", unitPrice: 40, image: '/jeans.jpg', attributes: {} },
  { name: "Pantalón amarillo", unitPrice: 30, image: null, attributes: {} },
  { name: "Pantalón rosa", unitPrice: 30, image: '/jeans.jpg', attributes: {} },
];

const inventario: InventarioItem[] = [
  { productName: "Pantalón azul marino", quantity: 10, entryDate: "2025-03-01" },
  { productName: "Pantalón azul claro", quantity: 5, entryDate: "2025-03-02" },
  { productName: "Pantalón verde", quantity: 8, entryDate: "2025-03-02" },
  { productName: "Pantalón amarillo", quantity: 5, entryDate: "2025-03-02" },
  { productName: "Pantalón rosa", quantity: 8, entryDate: "2025-03-02" }
];

// Función auxiliar para generar un ID único
const generateId = (): string => {
  return Date.now().toString();
};

const CheckoutVenta: React.FC<CheckoutVentaProps> = ({ onClose }) => {
  // Estado para cantidades, descuento y items del carrito
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    productosVenta.reduce((acc, prod) => {
      acc[prod.name] = 1;
      return acc;
    }, {} as Record<string, number>)
  );
  const [descuento, setDescuento] = useState<number>(0);
  const [inputDescuento, setInputDescuento] = useState<string>("0");
  const [ventaItems, setVentaItems] = useState<ProductoCarrito[]>([]);

  // Función para aumentar cantidad respetando el stock
  const aumentar = (productName: string) => {
    const stock = inventario.find(item => item.productName === productName)?.quantity ?? 0;
    setCantidades(prev => ({
      ...prev,
      [productName]: prev[productName] < stock ? prev[productName] + 1 : prev[productName]
    }));
  };

  // Función para disminuir cantidad (mínimo 1)
  const disminuir = (productName: string) => {
    setCantidades(prev => ({
      ...prev,
      [productName]: prev[productName] > 1 ? prev[productName] - 1 : 1
    }));
  };

  // Agregar producto al carrito
  const agregarAlCarrito = (producto: Producto) => {
    setVentaItems(prev => {
      const existe = prev.find(item => item.name === producto.name);
      if (existe) {
        return prev.map(item =>
          item.name === producto.name
            ? { ...item, unitPrice: producto.unitPrice, quantity: cantidades[producto.name] }
            : item
        );
      }
      return [...prev, { ...producto, quantity: cantidades[producto.name] }];
    });
  };

  // Calcular totales
  const subtotal = ventaItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const descuentoAplicado = descuento ? subtotal * (descuento / 100) : 0;
  const total = subtotal - descuentoAplicado;

  const eliminarDelCarrito = (producto: Producto) => {
    setVentaItems(prev => prev.filter(item => item.name !== producto.name));
  };

  // Confirmar venta y guardar en localStorage
  const confirmarVenta = () => {
    if (ventaItems.length === 0) {
      alert('No hay productos en el carrito');
      return;
    }

    const nuevaVenta = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      items: ventaItems,
      discount: descuento,
      subtotal,
      total: total < 0 ? 0 : total,
    };

    // Guardar la venta en localStorage
    const ventasPrevias = JSON.parse(localStorage.getItem("ventas") || "[]");
    ventasPrevias.push(nuevaVenta);
    localStorage.setItem("ventas", JSON.stringify(ventasPrevias));

    alert('Venta confirmada');
    // Cierra el componente de Checkout y actualiza la lista de ventas
    onClose();
  };

  return (
    <div className="flex ">
      <div className="w-3/4 p-12 bg-white rounded-lg h-auto">
        <h1 className="text-2xl font-bold mb-4">Nueva venta</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 justify-items-center">
          {productosVenta.map((producto) => {
            const stock = inventario.find(item => item.productName === producto.name)?.quantity ?? 0;
            return (
              <Card key={producto.name} className='border border-gray-300 rounded-lg w-full'>
                <CardContent className="text-center flex flex-col items-center gap-y-2">
                  <h2 className="font-semibold">{producto.name}</h2>
                  <p className="text-sm font-light">MXN ${producto.unitPrice}.00</p>
                  {producto.image ? (
                    <img src={producto.image} className='w-24 h-24 object-cover rounded mx-auto'/>
                  ) : (
                    <Image className="w-24 h-24 object-cover rounded mx-auto text-[#1366D9]" />
                  )}
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full bg-white">
                    <button onClick={() => disminuir(producto.name)} className="p-2 text-gray-700 hover:bg-gray-200 transition">
                      <Minus />
                    </button>
                    <input
                      type="number"
                      value={cantidades[producto.name]}
                      onChange={(e) => {
                        let valor = Number(e.target.value);
                        if (valor < 1) valor = 1;
                        if (valor > stock) valor = stock;
                        setCantidades(prev => ({ ...prev, [producto.name]: valor }));
                      }}
                      className="w-full text-center outline-none bg-transparent appearance-none"
                    />
                    <button onClick={() => aumentar(producto.name)} className="p-2 text-gray-700 hover:bg-gray-200 transition">
                      <Plus />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Stock: {stock}</p>
                  <button onClick={() => agregarAlCarrito(producto)} className="w-full h-10 rounded-sm bg-[#1366D9] text-white text-sm font-semibold shadow-lg">
                    Agregar
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <Button type="button" variant="outline" onClick={onClose} className="w-40  h-10">
            Cancelar 
          </Button>
        </div>
      </div>

      {/* Barra lateral de Checkout */}
      <div className="w-1/4 p-4 bg-white mx-4 h-full rounded-lg">
        <h1 className="text-xl font-bold mb-4">Resumen de venta</h1>
        {ventaItems.length === 0 ? (
          <p className="text-sm font-light">No hay productos agregados</p>
        ) : (
          <>
            <div className="space-y-2">
              {ventaItems.map(item => (
                <div key={item.name} className="flex text-sm justify-between">
                  <span className="w-1/3">{item.name} x {item.quantity}</span>
                  <div>
                    <span className='px-5'>MXN ${item.unitPrice * item.quantity}</span>
                    <span> 
                      <button onClick={() => eliminarDelCarrito(item)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>MXN ${subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Descuento:</span>
                <span>% {descuento}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>MXN ${total < 0 ? 0 : total}</span>
              </div>
            </div>

            {/* Input y botón para aplicar descuento */}
            <div className="mt-4">
              <label htmlFor="descuento" className="block text-sm font-medium">Descuento</label>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                  type="number"
                  value={inputDescuento}
                  onChange={(e) => setInputDescuento(e.target.value)}
                />
                <Button 
                  type="submit"
                  onClick={() => setDescuento(Number(inputDescuento))}
                > 
                  Aplicar
                </Button>
              </div>
            </div>

            {/* Botón para confirmar la venta */}
            <button 
              className="w-full h-10 mt-6 rounded-sm bg-[#1366D9]  text-white text-sm font-semibold shadow-lg"
              onClick={confirmarVenta}
            >
              Confirmar venta
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutVenta;




