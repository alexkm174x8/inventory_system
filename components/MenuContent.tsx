import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/userId'

interface TopProduct {
  name: string
  total_sales: number
  total_revenue: number
}

interface RecentSale {
  id: string
  customer: string
  date: string
  amount: number
  status: string
  statusColor: string
}

interface ProductVariant {
  product_id: string
  products: {
    name: string
  }
}

interface SalesItem {
  variant_id: string
  quantity_sold: number
  sale_price: number
  productVariants: ProductVariant
}

interface Client {
  name: string
}

interface Sale {
  id: string
  total_amount: number
  created_at: string
  client: string
  location: string
  clients: Client
}

const MenuContent = () => {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userId = await getUserId()
      if (!userId) return

      // Fetch top selling products
      const { data: topProductsData, error: topProductsError } = await supabase
        .from('sales_items')
        .select(`
          variant_id,
          quantity_sold,
          sale_price,
          sales!inner (
            user_id
          ),
          productVariants (
            product_id,
            products (
              name
            )
          )
        `)
        .eq('sales.user_id', userId)
        .order('quantity_sold', { ascending: false })
        .limit(5)

      if (topProductsError) throw topProductsError

      // Process top products data
      const processedTopProducts = (topProductsData as unknown as SalesItem[]).reduce((acc: TopProduct[], item) => {
        const existingProduct = acc.find(p => p.name === item.productVariants.products.name)
        if (existingProduct) {
          existingProduct.total_sales += item.quantity_sold
          existingProduct.total_revenue += item.quantity_sold * item.sale_price
        } else {
          acc.push({
            name: item.productVariants.products.name,
            total_sales: item.quantity_sold,
            total_revenue: item.quantity_sold * item.sale_price
          })
        }
        return acc
      }, [])

      // Fetch recent sales
      const { data: recentSalesData, error: recentSalesError } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          client,
          location,
          clients!inner (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentSalesError) throw recentSalesError

      // Process recent sales data
      const processedRecentSales = (recentSalesData as unknown as Sale[]).map(sale => ({
        id: `#PED-${sale.id}`,
        customer: sale.clients?.name || 'Cliente General',
        date: new Date(sale.created_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        amount: sale.total_amount,
        status: 'Completado',
        statusColor: 'bg-[#ebffed] text-[#10a760]'
      }))

      // Calculate total earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('user_id', userId)

      if (earningsError) throw earningsError

      const total = earningsData.reduce((sum, sale) => sum + sale.total_amount, 0)

      setTopProducts(processedTopProducts)
      setRecentSales(processedRecentSales)
      setTotalEarnings(total)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-[#f5f5f5]">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-[#f5f5f5]">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card 1 - Top Selling Products */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Productos más vendidos</h2>
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
                {topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      ${product.total_revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">
                      {product.total_sales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2 - Total Earnings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Ganancias Totales</h2>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ${totalEarnings.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">
              Ingresos totales de todas las ventas
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e6e6]">
              {recentSales.map((sale, i) => (
                <tr key={i} className="hover:bg-[#f5f5f5]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1b1f26]">{sale.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{sale.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">{sale.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1b1f26] font-medium">
                    ${sale.amount.toLocaleString()}
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