// VentasContent.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import LoginLogo from './login-logo';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter } from 'next/navigation';

interface SaleItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Venta {
  id: string;
  createdAt: string;
  items: SaleItem[];
  discount: number;
  subtotal: number;
  total: number;
}

interface SupabaseSale {
  id: number;
  user_id: number;
  total_amount: number;
  discount_percentage: number;
  created_at: string;
  sales_items?: {
    id: number;
    sale_id: number;
    variant_id: number;
    quantity_sold: number;
    sale_price: number;
    variant?: {
      id: number;
      product_id: number;
      sku: string;
      price: number;
      product?: {
        id: number;
        name: string;
      }
    }
  }[];
}

const VentasContent: React.FC = () => {
  const router = useRouter()
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Fetch sales from Supabase
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const userId = await getUserId();
        
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            *,
            sales_items:sales_items(
              *,
              variant:variant_id(
                *,
                product:product_id(*)
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (salesError) throw salesError;
        
        // Transform Supabase data to our Venta format
        const transformedSales: Venta[] = salesData.map((sale: SupabaseSale) => {
          const saleItems: SaleItem[] = sale.sales_items?.map(item => ({
            id: item.id,
            name: item.variant?.product?.name || 'Unknown Product',
            quantity: item.quantity_sold,
            unitPrice: item.sale_price
          })) || [];
          
          const subtotal = saleItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
          
          return {
            id: sale.id.toString(),
            createdAt: sale.created_at,
            items: saleItems,
            discount: sale.discount_percentage || 0,
            subtotal: subtotal,
            total: sale.total_amount
          };
        });
        
        setVentas(transformedSales);
        
        // Also load from localStorage for compatibility
        const ventasGuardadas = localStorage.getItem("ventas");
        if (ventasGuardadas) {
          const localSales = JSON.parse(ventasGuardadas);
          
          // Only add local sales that don't exist in Supabase data
          const existingIds = transformedSales.map(s => s.id);
          const uniqueLocalSales = localSales.filter(
            (ls: Venta) => !existingIds.includes(ls.id)
          );
          
          if (uniqueLocalSales.length > 0) {
            setVentas([...transformedSales, ...uniqueLocalSales]);
          }
        }
        
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
  }, []);

  // Function to update the sales list (e.g., after closing CheckoutVenta)
  const updateVentas = () => {
    // Trigger a full refresh from Supabase
    const fetchSales = async () => {
      try {
        setLoading(true);
        const userId = await getUserId();
        
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            *,
            sales_items:sales_items(
              *,
              variant:variant_id(
                *,
                product:product_id(*)
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (salesError) throw salesError;
        
        // Transform Supabase data to our Venta format
        const transformedSales: Venta[] = salesData.map((sale: SupabaseSale) => {
          const saleItems: SaleItem[] = sale.sales_items?.map(item => ({
            id: item.id,
            name: item.variant?.product?.name || 'Unknown Product',
            quantity: item.quantity_sold,
            unitPrice: item.sale_price
          })) || [];
          
          const subtotal = saleItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
          
          return {
            id: sale.id.toString(),
            createdAt: sale.created_at,
            items: saleItems,
            discount: sale.discount_percentage || 0,
            subtotal: subtotal,
            total: sale.total_amount
          };
        });
        
        setVentas(transformedSales);
        
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
  };

  // Filter sales based on search term and date
  const filteredVentas = ventas.filter(venta => {
    const matchesSearch = searchTerm === '' || 
      venta.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesDate = dateFilter === '' || 
      new Date(venta.createdAt).toLocaleDateString().includes(dateFilter);
    
    return matchesSearch && matchesDate;
  });

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      <>
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => router.push('/ventas/agregarventa')}
              className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'
            >
              <Plus className="w-4 h-4" />
              Crear venta
            </button>
            
            {/* Search and filter tools */}
            <div className="flex gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              </div>
              
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Filter className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 justify-items-center md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {filteredVentas.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No hay ventas registradas</p>
                </div>
              ) : (
                filteredVentas.map((venta) => {
                  const fecha = new Date(venta.createdAt);
                  return (
                    <div 
                      key={venta.id} 
                      className="relative flex flex-col bg-white shadow-sm border border-slate-200 rounded-lg w-full hover:shadow-md transition-shadow"
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
                          {venta.items.slice(0, 3).map((producto, index) => (
                            <li key={index} className="flex justify-between py-1">
                              <span>{producto.quantity}</span>
                              <span className="mx-2 text-ellipsis overflow-hidden">{producto.name}</span>
                              <span>${producto.unitPrice * producto.quantity} MXN</span>
                            </li>
                          ))}
                          {venta.items.length > 3 && (
                            <li className="text-center text-blue-600 text-sm py-1">
                              {venta.items.length - 3} productos más...
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="mx-3 border-t border-slate-200 pb-3 pt-2 px-1 flex justify-between items-center">
                        <p className="text-sm text-slate-600 font-medium">Total: ${venta.total} MXN</p>
                        <button 
                          className="text-blue-600 text-sm font-medium hover:text-blue-800"
                        >
                          Ver más
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
    </main>
  );
};

export default VentasContent;