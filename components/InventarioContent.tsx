import React, { useState, useEffect } from 'react';
import { Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import CreateProductView, { Product } from './CreateProductView';
import AddProductToStock from './AddProductToStock';
import ProductDetailView from './ProductDetailView';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';

interface InventoryItem {
  id: number; // ID de la tabla stock
  variant_id: number;
  product_name: string;
  quantity: number;
  added_at: string;
  ubicacion_nombre: string;
  caracteristicas: string[]; // Array para almacenar las características
}

const InventarioContent = () => {
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showAddProductToStock, setShowAddProductToStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [errorInventory, setErrorInventory] = useState<string | null>(null);

  const handleSaveProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleSaveStock = () => {
    loadInventory();
    setShowAddProductToStock(false);
  };

  const itemsPerPage = 5;
  const filteredData = inventory.filter(stock => filterStatus === "Todos");
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  }

  const [productList, setProductList] = useState<string | { name: string; id: number }[]>('Cargando...');

  useEffect(() => {
    async function getProducts() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.id) {
          const userId = await getUserId();

          const { data: products, error } = await supabase
            .from('products')
            .select('name, id')
            .eq('user_id', userId)

          if (error) {
            console.error('Error details:', error)
            return
          }

          setProductList(products);
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      }
    }
    getProducts()
  }, [supabase])

  const loadInventory = async () => {
    setLoadingInventory(true);
    setErrorInventory(null);
    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase
        .from('stock')
        .select(`
          id,
          variant_id,
          stock,
          added_at,
          locations (
            name
          ),
          productVariants (
            product_id,
            products (
              name,
              product_characteristics (
                name,
                characteristics_id
              )
            ),
            optionVariants (
              option_id,
              characteristics_options (
                values,
                characteristics_id
              )
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching inventory:", error);
        setErrorInventory(error.message);
      }

      if (data) {
        const formattedInventory = data.map(item => {
          const productName = item.productVariants?.products?.name || 'Nombre no encontrado';
          const locationName = item.locations?.name || 'Ubicación no encontrada';
          const productCharacteristics = item.productVariants?.products?.product_characteristics || [];

          const characteristics = item.productVariants?.optionVariants?.map(ov => {
            const matchingCharacteristic = productCharacteristics.find(pc => pc.characteristics_id === ov.characteristics_options?.characteristics_id);
            const characteristicName = matchingCharacteristic?.name || 'Característica';
            return `${characteristicName}: ${ov.characteristics_options?.values}`;
          }) || [];

          return {
            id: item.id,
            variant_id: item.variant_id,
            product_name: productName,
            quantity: item.stock,
            added_at: item.added_at,
            ubicacion_nombre: locationName,
            caracteristicas: characteristics,
          };
        });
        setInventory(formattedInventory);
      }
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      setErrorInventory(error.message);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  if (typeof productList === 'string') {
    return <div>{productList}</div>;
  }

  if (loadingInventory) {
    return <div>Cargando inventario...</div>;
  }

  if (errorInventory) {
    return <div>Error al cargar el inventario: {errorInventory}</div>;
  }

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      {selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      ) : showCreateProduct ? (
        <CreateProductView
          onClose={() => setShowCreateProduct(false)}
          onSaveProduct={handleSaveProduct}
        />
      ) : showAddProductToStock ? (
        <AddProductToStock
          // @ts-ignore: productList can be string | Product[]
          products={productList}
          onSaveStock={handleSaveStock}
          onClose={() => setShowAddProductToStock(false)}
        />
      ) : (
        <>
          <div className="flex gap-4 mb-9">
            <button
              onClick={() => setShowCreateProduct(true)}
              className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg'
            >
              <Plus className="w-4 h-4" />
              Crear producto
            </button>
            <button
              onClick={() => setShowAddProductToStock(true)}
              className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg'
            >
              <Plus className="w-4 h-4" />
              Agregar inventario
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-lg shadow p-10 mb-12 ">
            <div className="w-full">
              <table className='table-fixed w-full'>
                <tbody>
                  <tr>
                    <td><h2 className="whitespace-nowrap text-base font-bold uppercase text-orange-300">Productos Totales</h2></td>
                  </tr>
                  <tr>
                    <td >{products.length}</td>
                    <td ></td>
                  </tr>
                  <tr className='text-neutral-400 text-sm'>
                    <td >Ultimos 7 dias</td>
                    <td >Cantidad </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='w-full'>
              <table className='table-fixed w-full'>
                <tbody>
                  <tr>
                    <td><h2 className="text-base font-bold uppercase text-violet-300">Inventario Total</h2></td>
                  </tr>
                  <tr>
                    <td >{inventory.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td ></td>
                  </tr>
                  <tr className='text-neutral-400 text-sm'>
                    <td ></td>
                    <td >Cantidad </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className='w-full'>
              <table className='table-fixed w-full'>
                <tbody>
                  <tr>
                    <td><h2 className="text-base font-bold uppercase text-red-500">Productos con Stock</h2></td>
                  </tr>
                  <tr>
                    <td >{inventory.filter(item => item.quantity > 0).length}</td>
                    <td ></td>
                  </tr>
                  <tr className='text-neutral-400 text-sm'>
                    <td ></td>
                    <td>Cantidad </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mt-8">
            <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#1b1f26]">Tabla de inventario</h2>
              <div className="relative">
                <button
                  className="border-2 px-3 py-2 flex items-center gap-2 rounded-sm hoover:bg-gray-100"
                  onClick={toggleDropdown}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {filterStatus}
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-12 right-0 bg-white shadow-md border rounded-md w-40">
                    {["Todos"].map((option) => (
                      <button
                        key={option}
                        className={`flex justify-between px-4 py-2 w-full text-left hover:bg-gray-100 ${
                          filterStatus === option ? "font-ragular" : ""
                        }`}
                        onClick={() => {
                          setFilterStatus(option);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {option}
                        {filterStatus === option && <span><Check className='w-4 h-4 text-blue-700 '/></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5f5f5] text-center">
                    {["Producto", "Características", "Cantidad", "Ubicación", "Fecha de entrada", "Ver más"].map((header) => (
                      <th key={header} className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e6e6] text-center">
                  {currentData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26]">{item.product_name}</td>
                      <td className="px-6 py-4 text-sm text-[#667085]">{item.caracteristicas.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{item.ubicacion_nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{new Date(item.added_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedProduct(item)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-[#e6e6e6] flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-xs font-medium text-[#667085] uppercase tracking-wider">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={`border-2 px-3 py-2 flex items-center gap-2 rounded-sm ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default InventarioContent;