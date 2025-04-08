// CheckoutVenta.tsx - Fixed version
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Image, Trash2, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

// Interfaces for database entities
interface ProductVariant {
  id: number;
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
  category?: string; // Added category as optional property
}

interface CharacteristicOption {
  id: number;
  characteristic_id: number;
  value: string;
}

interface StockItem {
  id: number;
  variant_id: number;
  location: number;
  stock: number;
  added_at: string;
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
}

// Function to generate a unique ID
const generateId = (): string => {
  return Date.now().toString();
};

const CheckoutVenta: React.FC<CheckoutVentaProps> = ({ onClose }) => {
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

  // Fetch product data from Supabase
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Get user ID
        const userId = await getUserId();
        
        // Fetch products for this user
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId);
        
        if (productsError) throw productsError;
        
        // Fetch product variants with product info in one query
        const { data: variantsData, error: variantsError } = await supabase
          .from('productVariants')
          .select('*, product:product_id(*)')
          .in('product_id', productsData.map(p => p.id));
        
        if (variantsError) throw variantsError;
        
        // Fetch stock information for these variants
        const { data: stockData, error: stockError } = await supabase
          .from('stock')
          .select('*, location:location(*)')
          .in('variant_id', variantsData.map(v => v.id))
          .eq('location.user_id', userId);
        
        if (stockError) throw stockError;
        
        // Use your RPC function to get variant attributes
        const { data: attributesData, error: attributesError } = await supabase
          .rpc('get_variant_attributes', { user_id_param: userId });
        
        if (attributesError) throw attributesError;
        
        // Process the data
        setProducts(productsData);
        setProductVariants(variantsData);
        setStockItems(stockData);
        
        // Process attributes into a more usable format
        const varAttrs: Record<number, Record<string, string>> = {};
        if (attributesData) {
          attributesData.forEach((attr: any) => {
            if (!varAttrs[attr.variant_id]) {
              varAttrs[attr.variant_id] = {};
            }
            varAttrs[attr.variant_id][attr.characteristic_name] = attr.option_value;
          });
        }
        setVariantAttributes(varAttrs);
        
        // Initialize quantities for each variant
        const initialQuantities: Record<number, number> = {};
        variantsData.forEach((variant: ProductVariant) => {
          initialQuantities[variant.id] = 1;
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
    
    fetchProductData();
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

  // Find variant by options
  const findVariantByOptions = async (productId: number, optionIds: number[]) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase.rpc('find_variant_by_options', {
        p_user_id: userId,
        p_product_id: productId,
        p_option_ids: optionIds
      });
      
      if (error) throw error;
      return data && data.length > 0 ? data[0].variant_id : null;
    } catch (error) {
      console.error('Error finding variant:', error);
      return null;
    }
  };

  // Get available stock for a variant
  const getAvailableStock = (variantId: number): number => {
    const stockItem = stockItems.find(item => item.variant_id === variantId);
    return stockItem ? stockItem.stock : 0;
  };

  // Get product name for a variant
  const getProductName = (variantId: number): string => {
    const variant = productVariants.find(v => v.id === variantId);
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
    const variant = productVariants.find(v => v.id === variantId);
    if (!variant) return;
    
    const variantName = formatVariantName(variantId);
    
    setVentaItems(prev => {
      const existe = prev.find(item => item.variant_id === variantId);
      if (existe) {
        return prev.map(item =>
          item.variant_id === variantId
            ? { ...item, quantity: cantidades[variantId] }
            : item
        );
      }
      return [...prev, {
        id: Date.now(), // Just for React key
        variant_id: variantId,
        name: variantName,
        unitPrice: variant.price,
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

  // Confirm sale and save to Supabase with improved validation
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
      
      // Create new sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            user_id: userId,
            total_amount: total < 0 ? 0 : total,
            discount_percentage: descuento,
            created_at: new Date().toISOString()
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
      
      // Update stock levels
      for (const item of ventaItems) {
        const stockItem = stockItems.find(s => s.variant_id === item.variant_id);
        if (stockItem) {
          const { error: stockError } = await supabase
            .from('stock')
            .update({ stock: stockItem.stock - item.quantity })
            .eq('id', stockItem.id);
          
          if (stockError) throw stockError;
        }
      }
      
      // For backwards compatibility with localStorage-based system
      const ventaForLocalStorage = {
        id: saleId.toString(), // Use the actual Supabase ID
        createdAt: new Date().toISOString(),
        items: ventaItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        discount: descuento,
        subtotal,
        total: total < 0 ? 0 : total,
      };
      
      const ventasPrevias = JSON.parse(localStorage.getItem("ventas") || "[]");
      ventasPrevias.push(ventaForLocalStorage);
      localStorage.setItem("ventas", JSON.stringify(ventasPrevias));

      alert('Venta confirmada');
      onClose();
      
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error al guardar la venta');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Cargando productos...</div>;
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
        <h1 className="text-2xl font-bold mb-4">Nueva venta</h1>
        
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
        {filteredProducts.length === 0 ? (
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
                      const stock = getAvailableStock(variant.id);
                      const variantName = formatVariantName(variant.id);
                      
                      return (
                        <Card key={variant.id} className='border border-gray-300 rounded-lg w-full hover:shadow-md transition-shadow'>
                          <CardContent className="text-center flex flex-col items-center gap-y-2 p-4">
                            <h3 className="font-semibold">{variantName}</h3>
                            <p className="text-sm font-light">MXN ${variant.price}.00</p>
                            <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
                            
                            {variant.image_url ? (
                              <img src={variant.image_url} alt={variantName} className='w-24 h-24 object-cover rounded mx-auto'/>
                            ) : (
                              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded mx-auto">
                                <Image className="w-12 h-12 text-[#1366D9]" />
                              </div>
                            )}
                            
                            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full bg-white">
                              <button 
                                onClick={() => disminuir(variant.id)} 
                                className="p-2 text-gray-700 hover:bg-gray-200 transition"
                                disabled={stock <= 0}
                              >
                                <Minus />
                              </button>
                              <input
                                type="number"
                                value={stock <= 0 ? 0 : cantidades[variant.id] || 1}
                                onChange={(e) => {
                                  let valor = Number(e.target.value);
                                  if (valor < 1) valor = 1;
                                  if (valor > stock) valor = stock;
                                  setCantidades(prev => ({ ...prev, [variant.id]: valor }));
                                }}
                                className="w-full text-center outline-none bg-transparent appearance-none"
                                disabled={stock <= 0}
                              />
                              <button 
                                onClick={() => aumentar(variant.id)} 
                                className="p-2 text-gray-700 hover:bg-gray-200 transition"
                                disabled={stock <= 0}
                              >
                                <Plus />
                              </button>
                            </div>
                            
                            <div className={`text-xs ${stock > 5 ? 'text-green-600' : stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                              {stock > 0 ? `Stock: ${stock}` : 'Sin stock'}
                            </div>
                            
                            <button 
                              onClick={() => agregarAlCarrito(variant.id)} 
                              className={`w-full h-10 rounded-sm ${stock <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1366D9] hover:bg-[#0d4ea6]'} text-white text-sm font-semibold shadow-lg transition-colors`}
                              disabled={stock <= 0}
                            >
                              {stock <= 0 ? 'Sin stock' : 'Agregar'}
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
          <Button type="button" variant="destructive" onClick={onClose} className="w-40 h-10">
            <Trash2 className="w-4 h-4 mr-2" />
            Cancelar venta
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