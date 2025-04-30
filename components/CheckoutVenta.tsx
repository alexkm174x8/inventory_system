"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Image, Trash2, Search, Filter, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

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

// Interface for cart items
interface ProductoCarrito {
  id: number;
  variant_id: number;
  name: string;
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
  // State for location info
  const [locationInfo, setLocationInfo] = useState<Location | null>(null);
  
  // State for products, variants, stock and cart
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<Record<number, Record<string, string>>>({});
  
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [descuento, setDescuento] = useState<number>(0);
  const [inputDescuento, setInputDescuento] = useState<string>("0");
  const [ventaItems, setVentaItems] = useState<ProductoCarrito[]>([]);
  
  // Add states for search and filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

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
        
        // Manually fetch variant attributes since we had issues with the RPC function
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

  // Get product name for a variant
  const getProductName = (variantId: number): string => {
    const variant = productVariants.find(v => v.variant_id === variantId);
    if (!variant) return "Unknown Product";
    
    const product = products.find(p => p.id === variant.product_id);
    return product ? product.name : "Unknown Product";
  };

  // Format variant name with attributes
  const formatVariantName = (variantId: number): string => {
    const baseName = getProductName(variantId);
    const attrs = variantAttributes[variantId];
    
    if (!attrs || Object.keys(attrs).length === 0) {
      return baseName;
    }
    
    const attrString = Object.entries(attrs)
      .map(([characteristic, value]) => `${value}`)
      .join(", ");
    
    return `${baseName} (${attrString})`;
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
      alert("Error: No se encontraron detalles del producto.");
      return;
    }

    // Find the corresponding stock item for this variant
    const stockItem = stockItems.find(item => item.variant_id === variantId);

    // Check if we found a stock item and it has a valid price
    if (!stockItem || typeof stockItem.price !== 'number') {
        console.error("Stock information (including price) not found for variant ID:", variantId);
        alert(`Error: Precio no encontrado en el inventario para ${formatVariantName(variantId)}. No se puede agregar.`);
        return;
    }

    const unitPrice = stockItem.price;
    const variantName = formatVariantName(variantId);

    setVentaItems(prev => {
      const existe = prev.find(item => item.variant_id === variantId);
      if (existe) {
        // Update quantity if item already exists
        return prev.map(item =>
          item.variant_id === variantId
            ? { ...item, quantity: cantidades[variantId], unitPrice: unitPrice }
            : item
        );
      }
      // Add new item
      return [...prev, {
        id: Date.now(), // Just for React key
        variant_id: variantId,
        name: variantName,
        unitPrice: unitPrice,
        quantity: cantidades[variantId],
        image: variant.image_url,
        sku: variant.sku,
        attributes: variantAttributes[variantId] || {}
      }];
    });
  };

  // Remove from cart
  const eliminarDelCarrito = (variantId: number) => {
    setVentaItems(prev => prev.filter(item => item.variant_id !== variantId));
  };

  // Calculate totals
  const subtotal = ventaItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const descuentoAplicado = descuento ? subtotal * (descuento / 100) : 0;
  const total = subtotal - descuentoAplicado;

  // Confirm sale and save to Supabase
  const confirmarVenta = async () => {
    if (ventaItems.length === 0) {
      alert('No hay productos en el carrito');
      return;
    }

    // Validate stock levels before proceeding
    for (const item of ventaItems) {
      const stockItem = stockItems.find(s => s.variant_id === item.variant_id);
      const availableStock = stockItem ? stockItem.stock : 0;
      
      if (item.quantity > availableStock) {
        alert(`No hay suficiente stock para ${item.name}. Stock disponible: ${availableStock}`);
        return;
      }
    }

    try {
      const userId = await getUserId();
      
      // Create new sale record - now includes the location ID
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            user_id: userId,
            total_amount: total < 0 ? 0 : total,
            discount_percentage: descuento,
            created_at: new Date().toISOString(),
            location: locationId // Include the location ID in the sale
          }
        ])
        .select();
      
      if (saleError) throw saleError;
      if (!saleData || saleData.length === 0) throw new Error('Failed to create sale');
      
      const saleId = saleData[0].id;
      
      // Create sale items records
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
      
      // Update stock levels - specifically for the selected location
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
      
      alert('Venta confirmada');
      onClose();
      
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error al guardar la venta');
    }
  };

  if (loading) {
    return(
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
      </div>
    )
  }

  // Group variants by product for better organization
  const variantsByProduct: Record<number, ProductVariant[]> = {};
  productVariants.forEach(variant => {
    if (!variantsByProduct[variant.product_id]) {
      variantsByProduct[variant.product_id] = [];
    }
    variantsByProduct[variant.product_id].push(variant);
  });

  return (
    <div className="flex">
      {/* Products section */}
      <div className="w-3/4 p-8 bg-white rounded-lg h-auto">
        {/* Location header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Nueva venta</h1>
          {locationInfo && (
            <div className="flex items-center rounded-full bg-blue-50 px-3 py-1">
              <Building className="w-4 h-4 text-blue-700 mr-2" />
              <span className="text-blue-700 font-medium">{locationInfo.name}</span>
            </div>
          )}
        </div>
        
        {/* Search and Filter Bar */}
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
        
        {/* Products Display */}
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
           
              return (
                <div key={productId} className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">{product.name}</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 justify-items-center">
                    {variants.map(variant => {
                      // --- Find the stock item for this variant ---
                      const stockItem = stockItems.find(
                        item => item.variant_id === variant.variant_id && item.location === locationId
                      );
                      const stock = stockItem ? stockItem.stock : 0;
                      // --- Get the price from the stock item ---
                      const displayPrice = stockItem ? stockItem.price : null;
                      const variantName = formatVariantName(variant.variant_id);
           
                      return (
                        <Card key={variant.variant_id} className='border border-gray-300 rounded-lg w-full hover:shadow-md transition-shadow'>
                          <CardContent className="text-center flex flex-col items-center gap-y-2 p-4">
                            <h3 className="font-semibold">{variantName}</h3>
           
                            {displayPrice !== null ? (
                              <p className="text-sm font-light">MXN ${displayPrice.toFixed(2)}</p>
                            ) : (
                              <p className="text-sm font-light text-red-500">Precio no disponible</p>
                            )}
           
                            {/* <p className="text-xs text-gray-500">SKU: {variant.sku}</p> */}
           
                            {variant.image_url ? (
                              <img src={variant.image_url} alt={variantName} className='w-24 h-24 object-cover rounded mx-auto'/>
                            ) : (
                              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded mx-auto">
                                <Image className="w-12 h-12 text-[#1366D9]" />
                              </div>
                            )}
           
                            {/* Quantity Input - Uses 'stock' variable derived from stockItem */}
                            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full bg-white">
                              <button
                                onClick={() => disminuir(variant.variant_id)}
                                className="p-2 text-gray-700 hover:bg-gray-200 transition"
                                disabled={stock <= 0}
                              >
                                <Minus />
                              </button>
                              <input
                                type="number"
                                value={stock <= 0 ? 0 : cantidades[variant.variant_id] || 1}
                                onChange={(e) => {
                                  let valor = Number(e.target.value);
                                  if (valor < 1) valor = 1;
                                  // Use 'stock' variable derived from stockItem for max value
                                  if (valor > stock) valor = stock;
                                  setCantidades(prev => ({ ...prev, [variant.variant_id]: valor }));
                                }}
                                className="w-full text-center outline-none bg-transparent appearance-none"
                                disabled={stock <= 0}
                                // Hide arrows in number input for cleaner look
                                style={{ MozAppearance: 'textfield', appearance: 'textfield' }}
                              />
                              <button
                                onClick={() => aumentar(variant.variant_id)}
                                className="p-2 text-gray-700 hover:bg-gray-200 transition"
                                // Use 'stock' variable derived from stockItem
                                disabled={stock <= 0 || (cantidades[variant.variant_id] || 1) >= stock}
                              >
                                <Plus />
                              </button>
                            </div>
           
                            {/* Stock Status Display - Uses 'stock' variable derived from stockItem */}
                            <div className={`text-xs ${stock > 5 ? 'text-green-600' : stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                              {stock > 0 ? `Stock: ${stock}` : 'Sin stock'}
                            </div>
           
                            {/* Add Button - Disabled if no stock OR if price is unavailable */}
                            <button
                              onClick={() => agregarAlCarrito(variant.variant_id)}
                              className={`w-full h-10 rounded-sm ${stock <= 0 || displayPrice === null ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1366D9] hover:bg-[#0d4ea6]'} text-white text-sm font-semibold shadow-lg transition-colors`}
                              disabled={stock <= 0 || displayPrice === null}
                            >
                              {stock <= 0 ? 'Sin stock' : (displayPrice === null ? 'Precio no disp.' : 'Agregar')}
                            </button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
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

      {/* Checkout sidebar */}
      <div className="w-1/4 p-4 bg-white mx-4 h-full rounded-lg">
        <h1 className="text-xl font-bold mb-4">Resumen de venta</h1>
        {ventaItems.length === 0 ? (
          <p className="text-sm font-light">No hay productos agregados</p>
        ) : (
          <>
            <div className="space-y-2">
              {ventaItems.map(item => (
                <div key={item.id} className="flex text-sm justify-between">
                  <span className="w-1/3">{item.name} x {item.quantity}</span>
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
              <div className="flex justify-between text-sm">
                <span>Descuento:</span>
                <span>% {descuento}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>MXN ${total < 0 ? 0 : total}</span>
              </div>
            </div>

            {/* Discount input */}
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
