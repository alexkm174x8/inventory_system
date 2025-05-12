"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import LoginLogo from './login-logo';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter } from 'next/navigation';
import LocationSelector from './locationSelection';

interface SaleItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  attributes?: Record<string, string>;
}

interface Venta {
  id: string;
  createdAt: string;
  items: SaleItem[];
  discount: number;
  subtotal: number;
  total: number;
  locationId: number;
  locationName: string;
  clientId: number | null; // Added client ID
  clientName: string; // Added client name
}

interface SupabaseSale {
  id: number;
  user_id: number;
  total_amount: number;
  discount_percentage: number;
  location: number;
  created_at: string;
  client: number | null; // Add client field
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

interface Location {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
}

const VentasContent: React.FC = () => {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [variantAttributes, setVariantAttributes] = useState<Record<number, Record<string, string>>>({});
  const [locations, setLocations] = useState<Record<number, string>>({});
  const [clients, setClients] = useState<Record<number, string>>({});
  const [openLocations, setOpenLocations] = useState(false);


  const fetchLocations = async () => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const locationMap: Record<number, string> = {};
      data.forEach((location: Location) => {
        locationMap[location.id] = location.name;
      });
      
      return locationMap;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return {};
    }
  };

  // New function to fetch clients
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');
      
      if (error) throw error;
      
      const clientMap: Record<number, string> = {};
      data.forEach((client: Client) => {
        clientMap[client.id] = client.name;
      });
      
      return clientMap;
    } catch (error) {
      console.error('Error fetching clients:', error);
      return {};
    }
  };

  const fetchVariantAttributes = async (variantIds: number[]) => {
    if (!variantIds.length) return {};
    
    try {
      const { data: optionVariantsData, error: optionVariantsError } = await supabase
        .from('optionVariants')
        .select('*')
        .in('variant_id', variantIds);
      if (optionVariantsError) throw optionVariantsError;
      const optionIds = [...new Set(optionVariantsData.map(ov => ov.option_id))];
      const { data: optionsData, error: optionsError } = await supabase
        .from('characteristics_options')
        .select('*, product_characteristics(name)')
        .in('id', optionIds);
      if (optionsError) throw optionsError;
      const varAttrs: Record<number, Record<string, string>> = {};   
      optionVariantsData.forEach(ov => {
        const option = optionsData.find(o => o.id === ov.option_id);
        if (option) {
          if (!varAttrs[ov.variant_id]) {
            varAttrs[ov.variant_id] = {};
          }
          const characteristicName = option.product_characteristics?.name || "Unknown";
          varAttrs[ov.variant_id][characteristicName] = option.values;
        }
      });
      
      return varAttrs;
    } catch (error) {
      console.error('Error fetching variant attributes:', error);
      return {};
    }
  };

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const userId = await getUserId();
        
        // Fetch locations and clients first
        const locationMap = await fetchLocations();
        setLocations(locationMap);
        
        const clientMap = await fetchClients();
        setClients(clientMap);
        
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
        
        // Get unique variant IDs from all sales
        const variantIds = salesData.flatMap(sale => 
          sale.sales_items?.map(item => item.variant_id) || []
        );
        
        // Fetch attributes for all variants
        const attributes = await fetchVariantAttributes([...new Set(variantIds)]);
        setVariantAttributes(attributes);
        
        const transformedSales: Venta[] = salesData.map((sale: SupabaseSale) => {
          const saleItems: SaleItem[] = sale.sales_items?.map(item => ({
            id: item.id,
            name: item.variant?.product?.name || 'Unknown Product',
            quantity: item.quantity_sold,
            unitPrice: item.sale_price,
            attributes: attributes[item.variant_id] || {}
          })) || [];
          
          const subtotal = saleItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
          
          return {
            id: sale.id.toString(),
            createdAt: sale.created_at,
            items: saleItems,
            discount: sale.discount_percentage || 0,
            subtotal: subtotal,
            total: sale.total_amount,
            locationId: sale.location,
            locationName: locationMap[sale.location] || 'Ubicación desconocida',
            clientId: sale.client,
            clientName: sale.client ? clientMap[sale.client] || 'Cliente desconocido' : 'Sin cliente'
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
  }, []);

  const updateVentas = () => {
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
        
        // Get unique variant IDs from all sales
        const variantIds = salesData.flatMap(sale => 
          sale.sales_items?.map(item => item.variant_id) || []
        );
        
        // Fetch attributes for all variants
        const attributes = await fetchVariantAttributes([...new Set(variantIds)]);
        setVariantAttributes(attributes);
        
        // Transform Supabase data to our Venta format
        const transformedSales: Venta[] = salesData.map((sale: SupabaseSale) => {
          const saleItems: SaleItem[] = sale.sales_items?.map(item => ({
            id: item.id,
            name: item.variant?.product?.name || 'Unknown Product',
            quantity: item.quantity_sold,
            unitPrice: item.sale_price,
            attributes: attributes[item.variant_id] || {}
          })) || [];
          
          const subtotal = saleItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
          
          return {
            id: sale.id.toString(),
            createdAt: sale.created_at,
            items: saleItems,
            discount: sale.discount_percentage || 0,
            subtotal: subtotal,
            total: sale.total_amount,
            locationId: sale.location,
            locationName: locations[sale.location] || 'Ubicación desconocida',
            clientId: sale.client,
            clientName: sale.client ? clients[sale.client] || 'Cliente desconocido' : 'Sin cliente'
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
      ) ||
      venta.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const saleDate = new Date(venta.createdAt);
    const filterDate = dateFilter ? new Date(dateFilter) : null;
    
    const matchesDate = !filterDate || 
      (saleDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
       saleDate.getUTCMonth() === filterDate.getUTCMonth() &&
       saleDate.getUTCDate() === filterDate.getUTCDate());
    
    const matchesLocation = locationFilter === null || 
      (locationFilter !== null && Number(venta.locationId) === Number(locationFilter));
    
    return matchesSearch && matchesDate && matchesLocation;
  });

  // Helper function to format product name with attributes
  const formatProductWithAttributes = (item: SaleItem) => {
    if (!item.attributes || Object.keys(item.attributes).length === 0) {
      return item.name;
    }
    
    const attrString = Object.entries(item.attributes)
      .map(([characteristic, value]) => `${characteristic}: ${value}`)
      .join(", ");
    
    return `${item.name} (${attrString})`;
  };

  const [showModal, setShowModal] = useState(false);

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const handleLocationSelected = (locationId: number) => {
    setSelectedLocation(locationId);
    setIsDialogOpen(false); 
  };

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
          <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleButtonClick}
            className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'>
            <Plus className="w-4 h-4" />
            Crear venta
          </button>
          {showModal && (
            <LocationSelector
              isOpen={true}
              onClose={() => {
                setIsDialogOpen(false);
                setShowModal(false);
              }}
              onLocationSelected={(locationId) => {
                setSelectedLocation(locationId);
                setIsDialogOpen(false);
                setShowModal(false);
              }}
            />
          )}

            <div className="flex gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos o clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"/>
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              </div>
              
              <div className="relative">
                <select
                  value={locationFilter === null ? '' : locationFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocationFilter(value === '' ? null : Number(value));
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las ubicaciones</option>
                  {Object.entries(locations).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
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
                            <p className="font-light text-sm mt-2">Ubicación: {venta.locationName}</p>
                            <p className="font-light text-sm mt-2">Cliente: {venta.clientName}</p>
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
                              <span className="mx-2 text-ellipsis overflow-hidden">
                                {formatProductWithAttributes(producto)}
                              </span>
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
                          onClick={() => router.push(`/dashboard/ventas/${venta.id}`)}
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
    </main>
  );
};

export default VentasContent;