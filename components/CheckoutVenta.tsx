"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, ImageIcon, Trash2, Search, Building, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { getUserId, getUserRole } from '@/lib/userId';
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';

interface ProductVariant {
  variant_id: number; 
  product_id: number;
  sku: string;
  price: number;
  image_url: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  user_id: number;
  category?: string;
}

interface StockItem {
  id: number;
  variant_id: number;
  location: number;
  stock: number;
  price: number;
  added_at: string;
}

interface Location {
  id: number;
  name: string;
  location: string;
}

// New Client interface
interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  user_id: number;
  discount: number;
  is_default?: boolean;
}

// Interface for cart items
interface ProductoCarrito {
  id: number;
  variant_id: number;
  name: string;
  type: string[];
  unitPrice: number;
  quantity: number;
  image: string | null;
  sku: string;
  attributes: Record<string, string>;
}

// Props for the component
interface CheckoutVentaProps {
  onClose: () => void;
  locationId: number;
}

const CheckoutVenta: React.FC<CheckoutVentaProps> = ({ onClose, locationId }) => {
  const { toast } = useToast();
  // State for location info
  const [locationInfo, setLocationInfo] = useState<Location | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');  
  // Add state for admin status
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // State for products, variants, stock and cart
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<Record<number, Record<string, string>>>({});
  
  // New state for clients
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loadingClients, setLoadingClients] = useState<boolean>(true);
  
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [descuento, setDescuento] = useState<number>(0);
  const [inputDescuento, setInputDescuento] = useState<string>("0");
  const [ventaItems, setVentaItems] = useState<ProductoCarrito[]>([]);
  
  // Add states for search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch clients from database
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const userId = await getUserId();
        
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId);
        
        if (error) throw error;
        
        // Create default "Público en General" client if it doesn't exist
        let publicoGeneral = data?.find(client => 
          client.name.toLowerCase() === 'público en general' || 
          client.name.toLowerCase() === 'publico en general'
        );
        
        if (!publicoGeneral) {
          // Insert the default client
          const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert([
              {
                name: 'Público en General',
                user_id: userId,
                discount: 0,
                is_default: true
              }
            ])
            .select()
            .single();
          
          if (insertError) throw insertError;
          publicoGeneral = newClient;
        }
        
        // Combine the default client with other clients
        const allClients = publicoGeneral 
          ? [publicoGeneral, ...(data?.filter(c => c.id !== publicoGeneral?.id) || [])]
          : data || [];
        
        setClients(allClients);
        
        // Always select "Público en General" by default
        if (publicoGeneral) {
          setSelectedClientId(publicoGeneral.id);
          setDescuento(publicoGeneral.discount || 0);
          setInputDescuento(publicoGeneral.discount?.toString() || "0");

        } else if (data && data.length > 0) {
          // Fallback to first client if somehow publicoGeneral wasn't created
          setSelectedClientId(data[0].id);
          setDescuento(data[0].discount || 0);
          setInputDescuento(data[0].discount?.toString() || "0");
        }
        
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los clientes",
        });
      } finally {
        setLoadingClients(false);
      }
    };
    
    fetchClients();
  }, [toast]);

  // Fetch location information
  useEffect(() => {
    const fetchLocationInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, location')
          .eq('id', locationId)
          .single();
        
        if (error) throw error;
        setLocationInfo(data);
      } catch (error) {
        console.error('Error fetching location info:', error);
      }
    };

    if (locationId) {
      fetchLocationInfo();
    }
  }, [locationId]);

  // Fetch product data from Supabase
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Get user ID
        const userId = await getUserId();
        
        // First, fetch stock items for the selected location
        // This is the key change - we only get stock from the specified location
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('*')
          .eq('location', locationId)
          .eq('user_id', userId);
        
        if (stockError) throw stockError;
        
        // If there's no stock at this location, set empty arrays and return early
        if (!stockData || stockData.length === 0) {
          setStockItems([]);
          setProductVariants([]);
          setProducts([]);
          setLoading(false);
          return;
        }
        
        // Extract variant IDs from stock to fetch only relevant variants
        const variantIds = stockData.map(item => item.variant_id);
        
        // Fetch only the product variants that exist in this location's stock
        const { data: variantsData, error: variantsError } = await supabase
          .from('productVariants')
          .select('*')
          .in('variant_id', variantIds);
        
        if (variantsError) throw variantsError;
        
        // Extract product IDs to fetch only relevant products
        const productIds = variantsData.map(variant => variant.product_id);
        
        // Fetch only the products that have variants in this location's stock
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('user_id', userId);
        
        if (productsError) throw productsError;
        const { data: optionVariantsData, error: optionVariantsError } = await supabase
          .from('optionVariants')
          .select('*')
          .in('variant_id', variantIds);
        
        if (optionVariantsError) throw optionVariantsError;
        
        // Fetch characteristics options
        const { data: optionsData, error: optionsError } = await supabase
          .from('characteristics_options')
          .select('*, product_characteristics(name)')
          .in('id', optionVariantsData.map(ov => ov.option_id));
        
        if (optionsError) throw optionsError;
        
        // Process the data
        setProducts(productsData);
        setProductVariants(variantsData);
        setStockItems(stockData);
        
        // Process variant attributes into a more usable format
        const varAttrs: Record<number, Record<string, string>> = {};
        
        optionVariantsData.forEach(ov => {
          const option = optionsData.find(o => o.id === ov.option_id);
          if (option) {
            if (!varAttrs[ov.variant_id]) {
              varAttrs[ov.variant_id] = {};
            }
            // Use the characteristic name from the joined product_characteristics
            const characteristicName = option.product_characteristics?.name || "Unknown";
            varAttrs[ov.variant_id][characteristicName] = option.values;
          }
        });
        
        setVariantAttributes(varAttrs);
        
        // Initialize quantities for each variant
        const initialQuantities: Record<number, number> = {};
        variantsData.forEach((variant: ProductVariant) => {
          initialQuantities[variant.variant_id] = 1;
        });
        setCantidades(initialQuantities);
        
        // Extract categories from products
        if (productsData.length > 0) {
          const uniqueCategories = Array.from(new Set(
            productsData
              .map(p => p.category)
              .filter(Boolean) // Filter out undefined or null values
          ));
          setCategories(uniqueCategories as string[]);
        }
        
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (locationId) {
      fetchProductData();
    }
  }, [locationId]);

  // Add useEffect to check user role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const role = await getUserRole();
        setIsAdmin(role === 'admin' || role === 'superadmin');
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      }
    };
    
    checkUserRole();
  }, []);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                             (product.category && product.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Get available stock for a variant
  const getAvailableStock = (variantId: number): number => {
    const stockItem = stockItems.find(item => item.variant_id === variantId);
    return stockItem ? stockItem.stock : 0;
  };

  // Format variant name with attributes
  const formatVariantName = (variantId: number): string => {
    const attrs = variantAttributes[variantId];
    const attrLines = Object.entries(attrs)
      .map(([value]) => ` ${value}`)
      .join("\n");
    return `${attrLines}`;
  };
  
  const getCharacteristicNames = (variantId: number): string[] => {
    const attrs = variantAttributes[variantId];
    return Object.keys(attrs);
  };

  // Increase quantity respecting stock limits
  const aumentar = (variantId: number) => {
    const stock = getAvailableStock(variantId);
    setCantidades(prev => ({
      ...prev,
      [variantId]: prev[variantId] < stock ? prev[variantId] + 1 : prev[variantId]
    }));
  };

  // Decrease quantity (minimum 1)
  const disminuir = (variantId: number) => {
    setCantidades(prev => ({
      ...prev,
      [variantId]: prev[variantId] > 1 ? prev[variantId] - 1 : 1
    }));
  };

  // Add product to cart
  const agregarAlCarrito = (variantId: number) => {
    // Find the basic variant info (for name, sku, image etc.)
    const variant = productVariants.find(v => v.variant_id === variantId);
    if (!variant) {
      console.error("Variant details not found for ID:", variantId);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se encontraron detalles del producto.",
      });
      return;
    }

    // Find the corresponding stock item for this variant
    const stockItem = stockItems.find(item => item.variant_id === variantId);

    // Check if we found a stock item and it has a valid price
    if (!stockItem || typeof stockItem.price !== 'number') {
        console.error("Stock information (including price) not found for variant ID:", variantId);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Precio no encontrado en el inventario para ${formatVariantName(variantId)}. No se puede agregar.`,
        });
        return;
    }

    const unitPrice = stockItem.price;
    const variantName = formatVariantName(variantId);
    const variantType = getCharacteristicNames(variantId);

    setVentaItems(prev => {
      const existe = prev.find(item => item.variant_id === variantId);
      if (existe) {

        return prev.map(item =>
          item.variant_id === variantId
            ? { ...item, quantity: cantidades[variantId], unitPrice: unitPrice }
            : item
        );
      }
      return [...prev, {
        id: Date.now(), 
        variant_id: variantId,
        name: variantName,
        type: variantType,
        unitPrice: unitPrice,
        quantity: cantidades[variantId],
        image: variant.image_url,
        sku: variant.sku,
        attributes: variantAttributes[variantId] || {}
      }];
    });
  };
  const eliminarDelCarrito = (variantId: number) => {
    setVentaItems(prev => prev.filter(item => item.variant_id !== variantId));
  };
  const subtotal = ventaItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const descuentoAplicado = descuento ? subtotal * (descuento / 100) : 0;
  const total = subtotal - descuentoAplicado;
  const confirmarVenta = async () => {
    if (ventaItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay productos en el carrito",
      });
      return;
    }

    try {
      const userId = await getUserId();
      const role = await getUserRole();
      let userName = '';
      if (role === 'employee') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: employeeData } = await supabase
            .from('employees')
            .select('name')
            .eq('auth_id', session.user.id)
            .single();
          userName = employeeData?.name || 'Empleado no registrado';
        }
      } else {
        const { data: adminData } = await supabase
          .from('admins')
          .select('name')
          .eq('user_id', userId)
          .single();
        userName = adminData?.name || 'Admin no registrado';
      }
      
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            user_id: userId,
            total_amount: total < 0 ? 0 : total,
            discount_percentage: descuento,
            created_at: new Date().toISOString(),
            location: locationId,
            client: selectedClientId,
            salesman: userName
          }
        ])
        .select();
      
      if (saleError) throw saleError;
      if (!saleData || saleData.length === 0) throw new Error('Failed to create sale');
      const saleId = saleData[0].id;
      const saleItems = ventaItems.map(item => ({
        sale_id: saleId,
        variant_id: item.variant_id,
        quantity_sold: item.quantity,
        sale_price: item.unitPrice
      }));
      
      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      if (selectedClientId) {
        const { data: clientData, error: clientFetchError } = await supabase
          .from('clients')
          .select('num_compras, total_compras')
          .eq('id', selectedClientId)
          .eq('user_id', userId)
          .single();

        if (clientFetchError) throw clientFetchError;
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            num_compras: (clientData?.num_compras || 0) + 1,
            total_compras: (clientData?.total_compras || 0) + (total < 0 ? 0 : total)
          })
          .eq('id', selectedClientId)
          .eq('user_id', userId);
        
        if (clientError) throw clientError;
      }
      for (const item of ventaItems) {
        const stockItem = stockItems.find(s => 
          s.variant_id === item.variant_id && s.location === locationId
        );
        
        if (stockItem) {
          const { error: stockError } = await supabase
            .from('stock')
            .update({ stock: stockItem.stock - item.quantity })
            .eq('id', stockItem.id);
          
          if (stockError) throw stockError;
        }
      }
      
      toast({
        variant: "success",
        title: "¡Éxito!",
        description: "Venta confirmada correctamente",
      });
      onClose();
      
    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al guardar la venta",
      });
    }
  };

  if (loading || loadingClients) {
    return(
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
      </div>
    )
  }
  const variantsByProduct: Record<number, ProductVariant[]> = {};
  productVariants.forEach(variant => {
    if (!variantsByProduct[variant.product_id]) {
      variantsByProduct[variant.product_id] = [];
    }
    variantsByProduct[variant.product_id].push(variant);
  });

  return (
    <div className="flex">
      <div className="w-3/4 p-8 bg-white rounded-lg h-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold capitalize">Nueva venta</h1>
          {locationInfo && (
            <div className="flex items-center rounded-full bg-blue-50 px-3 py-1">
              <Building className="w-4 h-4 text-blue-700 mr-2" />
              <span className="text-blue-700 font-medium">{locationInfo.name}</span>
            </div>
          )}
        </div>
        <div className="mb-6 flex gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
          
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          )}
        </div>
        {products.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No hay productos disponibles en esta sucursal</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          Object.entries(variantsByProduct)
            .filter(([productId]) => filteredProducts.some(p => p.id === Number(productId)))
            .map(([productId, variants]) => {
              const product = products.find(p => p.id === Number(productId));
              if (!product) return null;
              const selectedVariant = variants.find(v => v.variant_id === Number(selectedVariantId));
              const selectedStockItem = selectedVariant
                ? stockItems.find(
                    item => item.variant_id === selectedVariant.variant_id && item.location === locationId
                  )
                : null;
              const selectedStock = selectedStockItem ? selectedStockItem.stock : 0;
              const selectedDisplayPrice = selectedStockItem ? selectedStockItem.price : null;

              return (
                <div key={productId} className="mb-8">
                  <Card className="border border-gray-300 rounded-lg w-full hover:shadow-md transition-shadow">
                    <CardContent className="text-center flex flex-col items-center gap-y-2 p-4">
                      <h2 className="text-xl font-semibold mb-3 capitalize">{product.name}</h2>
                      <h3 className="mb-2 text-sm text-gray-600">
                        {variants.length > 0 ? getCharacteristicNames(variants[0].variant_id).join(", ") : ""}
                      </h3>

                      {/* Botones de variantes */}
                      <div className="w-full flex flex-wrap gap-2 justify-center">
                        {variants.map((variant) => {
                          const idStr = variant.variant_id.toString();
                          const name = formatVariantName(variant.variant_id);
                          const isSelected = idStr === selectedVariantId;

                          return (
                              <button
                                key={variant.variant_id}
                                type="button"
                                onClick={() => setSelectedVariantId(idStr)}
                                className={`px-4 py-2 rounded-md border transition 
                                  ${isSelected ? 'bg-[#1366D9] text-white border-indigo-500' : 'bg-white text-gray-700 border-gray-300'}`}
                              >
                                {name}
                              </button>
                          );
                        })}
                      </div>

                      {/* Imagen de la variante seleccionada o placeholder */}
                      {selectedVariant?.image_url ? (
                        <Image
                          src={selectedVariant.image_url}
                          alt={`Producto ${formatVariantName(selectedVariant.variant_id)}`}
                          width={96}
                          height={96}
                          className="object-cover rounded mx-auto mt-4"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded mx-auto mt-4">
                          <ImageIcon className="w-12 h-12 text-[#1366D9]" />
                        </div>
                      )}

                      {/* Siempre visible: cantidad, stock, precio y botón */}
                      <div className="mt-4 w-full">
                        {/* Selector de cantidad */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full bg-white">
                          <button
                            onClick={() => selectedVariant && disminuir(selectedVariant.variant_id)}
                            className="p-2 text-gray-700 hover:bg-gray-200 transition"
                            disabled={!selectedVariant || selectedStock <= 0}
                          >
                            <Minus />
                          </button>
                          <input
                            type="number"
                            value={
                              selectedVariant
                                ? selectedStock <= 0
                                  ? 0
                                  : cantidades[selectedVariant.variant_id] || 1
                                : ''
                            }
                            onChange={(e) => {
                              if (!selectedVariant) return;
                              let valor = Number(e.target.value);
                              if (valor < 1) valor = 1;
                              if (valor > selectedStock) valor = selectedStock;
                              setCantidades((prev) => ({ ...prev, [selectedVariant.variant_id]: valor }));
                            }}
                            className="w-full text-center outline-none bg-transparent appearance-none"
                            disabled={!selectedVariant || selectedStock <= 0}
                            style={{ MozAppearance: 'textfield', appearance: 'textfield' }}
                            placeholder="Cantidad"
                          />
                          <button
                            onClick={() => selectedVariant && aumentar(selectedVariant.variant_id)}
                            className="p-2 text-gray-700 hover:bg-gray-200 transition"
                            disabled={
                              !selectedVariant ||
                              selectedStock <= 0 ||
                              (cantidades[selectedVariant?.variant_id] || 1) >= selectedStock
                            }
                          >
                            <Plus />
                          </button>
                        </div>

                        {/* Stock */}
                        <div
                          className={`text-xs m-3 ${
                            selectedVariant
                              ? selectedStock > 5
                                ? 'text-green-600'
                                : selectedStock > 0
                                ? 'text-orange-500'
                                : 'text-red-500'
                              : 'text-gray-400'
                          }`}
                        >
                          {selectedVariant
                            ? selectedStock > 0
                              ? `Stock: ${selectedStock} piezas`
                              : 'Sin stock'
                            : 'Selecciona una variante'}
                        </div>

                        {/* Precio */}
                        <div className="text-sm text-gray-800 font-medium m-3">
                          {selectedVariant && selectedDisplayPrice !== null
                            ? `Precio: MXN $${selectedDisplayPrice}`
                            : 'Precio: —'}
                        </div>

                        {/* Botón agregar */}
                        <button
                          onClick={() => selectedVariant && agregarAlCarrito(selectedVariant.variant_id)}
                          className={`w-full h-10 rounded-sm ${
                            !selectedVariant || selectedStock <= 0 || selectedDisplayPrice === null
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-[#1366D9] hover:bg-[#0d4ea6]'
                          } text-white text-sm font-semibold shadow-lg transition-colors`}
                          disabled={!selectedVariant || selectedStock <= 0 || selectedDisplayPrice === null}
                        >
                          {!selectedVariant
                            ? 'Selecciona una variante'
                            : selectedStock <= 0
                            ? 'Sin stock'
                            : selectedDisplayPrice === null
                            ? 'Precio no disp.'
                            : 'Agregar'}
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              );
            })
        )}
        <div className="text-center mt-10">
          <Button type="button" variant="outline" onClick={onClose} className="w-40 h-10">
            Cancelar 
          </Button>
        </div>
      </div>
      <div className="w-1/4 p-4 bg-white mx-4 h-full rounded-lg">
        <h1 className="text-lg font-semibold capitalize">Resumen de venta</h1>
        <div className="mb-4">
          <label htmlFor="client" className="text-sm font-medium mb-2 flex items-center">
            <Users className="w-4 h-4 mr-1 text-gray-500" />
            Cliente
          </label>
          
          {clients.length > 0 ? (
            <Select 
              value={selectedClientId?.toString() || ""} 
              onValueChange={(value) => {
                const clientId = Number(value);
                setSelectedClientId(clientId);
                const selectedClient = clients.find(c => c.id === clientId);
                if (selectedClient) {
                  setDescuento(selectedClient.discount || 0);
                  setInputDescuento(selectedClient.discount?.toString() || "0");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem 
                    key={client.id} 
                    value={client.id.toString()}
                    className={client.is_default ? "font-semibold" : ""}
                  >
                    {client.name} {client.discount > 0 ? `(${client.discount}% desc.)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-gray-500">No hay clientes disponibles</p>
          )}
        </div>
        
        {ventaItems.length === 0 ? (
          <p className="text-sm font-light">No hay productos agregados</p>
        ) : (
          <>
            <div className="space-y-2">
              {ventaItems.map(item => (
                <div key={item.id} className="flex text-sm justify-between">
                  <span className="w-1/3"> {item.type}: {item.name}  x {item.quantity}</span>
                  <div>
                    <span className='px-5'>MXN ${item.unitPrice * item.quantity}</span>
                    <span> 
                      <button onClick={() => eliminarDelCarrito(item.variant_id)}>
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
              {isAdmin && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Descuento:</span>
                    <span>% {descuento}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>MXN ${total < 0 ? 0 : total}</span>
                  </div>
                </>
              )}
              {!isAdmin && (
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>MXN ${subtotal}</span>
                </div>
              )}
            </div>

            {/* Discount input - only show for admins */}
            {isAdmin && (
              <div className="mt-4">
                <label htmlFor="descuento" className="block text-sm font-medium">
                  Descuento {selectedClientId && clients.find(c => c.id === selectedClientId)?.discount ? 
                    `(Descuento del cliente: ${clients.find(c => c.id === selectedClientId)?.discount}%)` : ''}
                </label>
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
            )}

            {/* Confirm sale button */}
            <button 
              className="w-full h-10 mt-6 rounded-sm bg-[#1366D9] text-white text-sm font-semibold shadow-lg hover:bg-[#0d4ea6] transition-colors"
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
