import React, { useState } from 'react'
import { Eye, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, ClipboardPlus } from 'lucide-react';
import CreateProductView from './CreateProductView';

const InventarioContent = () => {
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto m-3 bg-[#f5f5f5]">
      {showCreateProduct ? (
        <CreateProductView onClose={() => setShowCreateProduct(false)} />
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
            <button className='px-3 py-3 flex items-center gap-2 rounded-sm bg-[#1366D9] text-white shadow-lg'>
              <ClipboardPlus className="w-4 h-4" />
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

          <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#1b1f26]">Productos</h2>
              <button className='border-2 px-3 py-2 flex items-center gap-2 rounded-sm'>
              <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5f5f5]">
                    <th className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Precio unitario
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Cantidad en existencia 
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Fecha de llegada 
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Disponibilidad
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Ver mas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e6e6]">
                  {[
                    {
                      name: "Pantalón azul marino",
                      price_pu: "$30.00 MXN",
                      ex_quantity : "50",
                      arrival_date: "02/30/2025",
                      status: "In stock",
                      statusColor: "bg-[#ebffed] text-[#10a760]",
                      seemore: <Eye/>
                    },
                    {
                      name: "Pantalón azul claro",
                      price_pu: "$40.00 MXN",
                      ex_quantity : "20",
                      arrival_date: "04/30/2025",
                      status: "In stock",
                      statusColor: "bg-[#ebffed] text-[#10a760]",
                      seemore: <Eye/>
                    },
                    {
                      name: "Pantalón azul claro",
                      price_pu: "$40.00 MXN",
                      ex_quantity : "20",
                      arrival_date: "04/30/2025",
                      status: "Out of stock",
                      statusColor: "bg-red-200 text-red-600",
                      seemore: <Eye/>
                    },
                    {
                      name: "Pantalón azul claro",
                      price_pu: "$40.00 MXN",
                      ex_quantity : "20",
                      arrival_date: "04/30/2025",
                      status: "Out of stock",
                      statusColor: "bg-red-200 text-red-600",
                      seemore: <Eye/>
                    }

                  ].map((product, i) => (
                    <tr key={i} >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26]">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{product.price_pu}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{product.ex_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1b1f26] font-medium">{product.arrival_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.statusColor}`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 text-[#007aff]  hover:text-[#e8f1fd]'>{product.seemore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
                <button className="border-2 px-3 py-2 flex items-center gap-2 rounded-sm">
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-xs font-medium text-[#667085] uppercase tracking-wider">
                  Página 1 de 10
                </span>
                <button className="border-2 px-3 py-2 flex items-center gap-2 rounded-sm">
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

export default InventarioContent