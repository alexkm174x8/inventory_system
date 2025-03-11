import React from 'react'

const MenuContent = () => {
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-[#f5f5f5]">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">Productos m&aacute;s vendidos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ganancia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ventas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Ropa</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">$26,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">34</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Pantalon</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">$22,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">89</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Playeras</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">$22,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">67</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">Productos m&aacute;s vendidos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ganancia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ventas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Ropa</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">$26,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">34</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Pantalon</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">$22,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">89</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">Playeras</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">$22,000</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">67</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#1b1f26]">Tabla</h2>
            </div>
            <div className="overflow-x-auto">
              {/* Content */}
            </div>
          </div>
          
          
          {/* Top selling */}
          <div className="bg-white rounded-lg border border-[#e6e6e6] shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-[#e6e6e6] flex justify-between items-center">
              <h2 className="text-lg font-medium text-[#1b1f26]">Pedidos Recientes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5f5f5]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      ID Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#667085] uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e6e6]">
                  {[
                    {
                      id: "#PED-7352",
                      customer: "Juan Pérez",
                      date: "5 Mar 2023",
                      amount: "$125.00",
                      status: "Completado",
                      statusColor: "bg-[#ebffed] text-[#10a760]",
                    },
                    {
                      id: "#PED-7351",
                      customer: "María García",
                      date: "4 Mar 2023",
                      amount: "$245.99",
                      status: "En Proceso",
                      statusColor: "bg-[#e8f1fd] text-[#007aff]",
                    },
                    {
                      id: "#PED-7350",
                      customer: "Miguel Rodríguez",
                      date: "4 Mar 2023",
                      amount: "$79.99",
                      status: "Completado",
                      statusColor: "bg-[#ebffed] text-[#10a760]",
                    },
                    {
                      id: "#PED-7349",
                      customer: "Ana Martínez",
                      date: "3 Mar 2023",
                      amount: "$149.50",
                      status: "Cancelado",
                      statusColor: "bg-[#ffeedb] text-[#e19133]",
                    },
                    {
                      id: "#PED-7348",
                      customer: "Roberto Sánchez",
                      date: "3 Mar 2023",
                      amount: "$89.99",
                      status: "Completado",
                      statusColor: "bg-[#ebffed] text-[#10a760]",
                    },
                  ].map((order, i) => (
                    <tr key={i} className="hover:bg-[#f5f5f5]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26]">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{order.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{order.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1b1f26] font-medium">{order.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.statusColor}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </main>
  )
}

export default MenuContent