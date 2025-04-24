import React, { useState, useEffect } from 'react';
import { Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import CreateProductView, { Product as CreateProductType } from './CreateProductView';
import AddProductToStock from './AddProductToStock';
import ProductDetailView, { StockRecord, Product as ProductDetailType } from './ProductDetailView';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter } from 'next/navigation';

interface InventoryItem extends StockRecord, Partial<ProductDetailType> {
  id: number; 
  variant_id: number;
  added_at: string;
  ubicacion_nombre: string;
  caracteristicas: string[];
}

type SupabaseStockItem = {
  id: number;
  variant_id: number;
  stock: number;
  added_at: string;
  locations: { name: string } | null;
  productVariants: {
    product_id: number;
    products: {
      name: string;
      product_characteristics: {
        name: string;
        characteristics_id: number;
      }[];
    } | null;
    optionVariants: {
      option_id: number;
      characteristics_options: {
        values: string;
        characteristics_id: number;
      } | null;
    }[];
  } | null;
  user_id: string;
};

const InventarioContent = () => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [products, setProducts] = useState<CreateProductType[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [errorInventory, setErrorInventory] = useState<string | null>(null);

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
          locations ( name ),
          productVariants (
            product_id,
            products (
              name,
              product_characteristics ( name, characteristics_id )
            ),
            optionVariants (
              option_id,
              characteristics_options ( values, characteristics_id )
            )
          )
        `)
        .eq('user_id', userId)
        .returns<SupabaseStockItem[]>();

      if (error) {
        console.error("Error fetching inventory:", error);
        setErrorInventory(error.message);
        setInventory([]);
        return;
      }

      if (data) {
        const formattedInventory: InventoryItem[] = data.map((item): InventoryItem | null => {
          const productVariant = item.productVariants;
          const productInfo = productVariant?.products;
          const locationInfo = item.locations;

          const productName = productInfo?.name ?? 'Nombre no encontrado';
          const locationName = locationInfo?.name ?? 'Ubicación no encontrada';
          const productCharacteristics = productInfo?.product_characteristics ?? [];
          const optionVariants = productVariant?.optionVariants ?? [];

          const characteristics = optionVariants.map(ov => {
            const charOption = ov.characteristics_options;
            if (!charOption) return 'Opción inválida';

            const matchingCharacteristic = productCharacteristics.find(
              pc => pc.characteristics_id === charOption.characteristics_id
            );
            const characteristicName = matchingCharacteristic?.name ?? 'Característica';
            return `${characteristicName}: ${charOption.values}`;
          });

          if (productName === 'Nombre no encontrado') {
             console.warn(`Inventory item with id ${item.id} missing product name.`);
          }

          return {
            id: item.id,
            variant_id: item.variant_id,
            productName: productName,
            name: productName,
            quantity: item.stock,
            added_at: item.added_at,
            entryDate: new Date(item.added_at).toLocaleDateString(),
            ubicacion_nombre: locationName,
            caracteristicas: characteristics,
            unitPrice: 0,
            image: null,
            attributes: [],
          };
        }).filter((item): item is InventoryItem => item !== null);

        setInventory(formattedInventory);
      }
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      setErrorInventory(error.message);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  if (loadingInventory) {
    return (
      <main className="flex-1 flex justify-center items-center h-screen bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
      </main>
    );
  }

  if (errorInventory) {
    return (
      <main className="flex-1 flex justify-center items-center h-screen bg-[#f5f5f5]">
         <div className="text-red-500">Error al cargar el inventario: {errorInventory}</div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
        <>
          <div className="flex gap-4 mb-9">
            <button
              onClick={() => router.push('/inventario/crearproducto')}
              className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'
            >
              <Plus className="w-4 h-4" />
              Crear producto
            </button>
            <button
              onClick={() => router.push('/inventario/agregarinventario')}
              className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg hover:bg-[#0d4ea6] transition-colors'
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26]">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-[#667085]">{item.caracteristicas.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{item.ubicacion_nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{item.entryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
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
    </main>
  );
};

export default InventarioContent;