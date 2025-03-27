import React, { useState, useEffect } from 'react';
import { Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import CreateProductView, { Product } from './CreateProductView';
import AddProductToStock, { StockRecord } from './AddProductToStock';
import ProductDetailView from './ProductDetailView';
const InventarioContent = () => {
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showAddProductToStock, setShowAddProductToStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<(StockRecord & Product) | null>(null)
  // aqui se almacena la informacion del inventario de los productos como sus detalles para mostrarlos en productdetailview
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // dice si el menu desplegabla para selccionar el flitro esta abierto 
  const [products, setProducts] = useState<Product[]>([]);
  //array que almacena todos los productos 
  const [inventory, setInventory] = useState<StockRecord[]>([]);
  // array donde se guarda el inventario de los productos 

  const handleSaveProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleSaveStock = (newStock: StockRecord) => {
    setInventory((prevInventory) => {
      const existingIndex = prevInventory.findIndex((item) => item.productName === newStock.productName);
  
      if (existingIndex !== -1) {
        // Si el producto ya existe, suma la cantidad al existente
        const updatedInventory = [...prevInventory];
        updatedInventory[existingIndex] = {
          ...updatedInventory[existingIndex],
          quantity: updatedInventory[existingIndex].quantity + newStock.quantity,
          entryDate: newStock.entryDate, // Puedes decidir si actualizar la fecha o mantener la anterior
        };
        return updatedInventory;
      } else {
        // Si no existe, agrégalo como nuevo
        return [...prevInventory, newStock];
      }
    });
  };

  const itemsPerPage = 5;
  const filteredData = inventory.filter(stock => filterStatus === "Todos" );
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

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      {selectedProduct ? (
        <ProductDetailView 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          // se renderiza el componente productdetal view 
        />
      ) : showCreateProduct ? (
        <CreateProductView 
          onClose={() => setShowCreateProduct(false)}
          onSaveProduct={handleSaveProduct}
        />
        // se rederiza y se guara del producto 
      ) : showAddProductToStock ? (
        <AddProductToStock 
          products={products} 
          onSaveStock={handleSaveStock} 
          onClose={() => setShowAddProductToStock(false)} 
        />
        // se pasa el arreglo de productos y la funcion para guardar el stock 
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
            {/* Tabla 1 */}
            <div className="w-full">
              {/* TODO: Specific size gets to close */}
              
              <table className='table-fixed w-full'>
                <tbody>
                  <tr>
                    <td><h2 className="whitespace-nowrap text-base font-bold uppercase text-orange-300">Productos Totales</h2></td>
                  </tr>
                  <tr>
                    <td >870</td>
                    <td >$20,000</td>
                  </tr>
                  <tr className='text-neutral-400 text-sm'>
                    <td >Ultimos 7 dias</td>
                    <td >Cantidad </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Tabla 2 */}
            <div className='w-full'>
              <table className='table-fixed w-full'>
                <tbody>
                  <tr>
                    <td><h2 className="text-base font-bold uppercase text-violet-300">Mas vendidos</h2></td>
                  </tr>
                  <tr>
                    <td >870</td>
                    <td >$20,000</td>
                  </tr>
                  <tr className='text-neutral-400 text-sm'>
                    <td >Ultimos 7 dias</td>
                    <td >Cantidad </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Tabla 3 */}
            <div className='w-full'>
              <table className='table-fixed w-full'>
                <tbody>
                  <tr>
                    <td ><h2 className="text-base font-bold uppercase text-red-500">Menos vendidos</h2></td>
                  </tr>
                  <tr>
                    <td >870</td>
                    <td >$20,000</td>
                  </tr>
                  <tr className='text-neutral-400 text-sm'>
                    <td >Ultimos 7 dias</td>
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
                    {["Producto", "Cantidad", "Fecha de entrada", "Ver más"].map((header) => (
                      <th key={header} className="px-3 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e6e6] text-center">
                  {currentData.map((stock, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26]">{stock.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{stock.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{stock.entryDate}</td>
                      <td 
                        className="px-6 py-4 text-[#007aff] hover:text-[#e8f1fd] cursor-pointer"
                        onClick={() => {
                          const foundProduct = products.find((p) => p.name === stock.productName);
                          if (foundProduct) {
                            setSelectedProduct({ ...stock, ...foundProduct });
                          }
                        }}
                      >
                        <Eye />
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