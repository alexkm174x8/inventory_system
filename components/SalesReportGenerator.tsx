'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useToast } from "@/components/ui/use-toast";
import { Download, Calendar, MapPin } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesReportData {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  salesByDate: {
    date: string;
    count: number;
    amount: number;
  }[];
  topProducts: {
    name: string;
    quantity: number;
    total: number;
  }[];
  salesByClient: {
    clientName: string;
    count: number;
    amount: number;
  }[];
}

interface SalesReportGeneratorProps {
  locations: Record<number, string>;
}

const SalesReportGenerator: React.FC<SalesReportGeneratorProps> = ({ locations }) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfComponents, setPdfComponents] = useState<any>(null);

  // Dynamically import PDF components only on client side
  useEffect(() => {
    const loadPdfComponents = async () => {
      try {
        const pdfRenderer = await import('@react-pdf/renderer');
        setPdfComponents(pdfRenderer);
      } catch (error) {
        console.error('Error loading PDF components:', error);
      }
    };

    loadPdfComponents();
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor seleccione un rango de fechas",
      });
      return;
    }

    try {
      setLoading(true);
      const userId = await getUserId();

      // Format dates for the database query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      // Fetch sales data
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          *,
          sales_items:sales_items(
            *,
            variant:variant_id(
              *,
              product:product_id(*)
            )
          ),
          clients(name)
        `)
        .eq('user_id', userId)
        .gte('created_at', formattedStartDate)
        .lte('created_at', formattedEndDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter by location if selected
      const filteredSales = selectedLocation 
        ? sales.filter(sale => sale.location === selectedLocation)
        : sales;

      // Process sales data
      const salesByDate: Record<string, { count: number; amount: number }> = {};
      const productSales: Record<string, { quantity: number; total: number }> = {};
      const clientSales: Record<string, { count: number; amount: number }> = {};

      let totalAmount = 0;
      let totalSales = filteredSales.length;

      filteredSales.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString();
        const amount = sale.total_amount;
        totalAmount += amount;

        // Aggregate by date
        if (!salesByDate[date]) {
          salesByDate[date] = { count: 0, amount: 0 };
        }
        salesByDate[date].count++;
        salesByDate[date].amount += amount;

        // Aggregate by client
        const clientName = sale.clients?.name || 'Sin cliente';
        if (!clientSales[clientName]) {
          clientSales[clientName] = { count: 0, amount: 0 };
        }
        clientSales[clientName].count++;
        clientSales[clientName].amount += amount;

        // Aggregate by product
        sale.sales_items?.forEach((item: { 
          variant?: { 
            product?: { 
              name: string 
            } 
          }, 
          quantity_sold: number, 
          sale_price: number 
        }) => {
          const productName = item.variant?.product?.name || 'Producto desconocido';
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, total: 0 };
          }
          productSales[productName].quantity += item.quantity_sold;
          productSales[productName].total += item.quantity_sold * item.sale_price;
        });
      });

      // Sort and limit top products
      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          total: data.total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Sort and limit top clients
      const topClients = Object.entries(clientSales)
        .map(([name, data]) => ({
          clientName: name,
          count: data.count,
          amount: data.amount,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setReportData({
        totalSales,
        totalAmount,
        averageTicket: totalSales > 0 ? totalAmount / totalSales : 0,
        salesByDate: Object.entries(salesByDate).map(([date, data]) => ({
          date,
          count: data.count,
          amount: data.amount,
        })),
        topProducts,
        salesByClient: topClients,
      });

    } catch (err) {
      console.error('Error generating report:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al generar el reporte",
      });
    } finally {
      setLoading(false);
    }
  };

  // PDF Document Component - only create when PDF components are loaded
  const createPDFDocument = () => {
    if (!pdfComponents || !reportData || !startDate || !endDate) return null;

    const { Document, Page, Text, View, StyleSheet } = pdfComponents;

    // PDF Styles
    const styles = StyleSheet.create({
      page: {
        padding: 30,
        fontSize: 12,
      },
      header: {
        marginBottom: 20,
        textAlign: 'center',
      },
      title: {
        fontSize: 24,
        marginBottom: 10,
      },
      subtitle: {
        fontSize: 14,
        marginBottom: 5,
      },
      section: {
        marginBottom: 20,
      },
      sectionTitle: {
        fontSize: 16,
        marginBottom: 15,
        borderBottom: '1 solid #ccc',
        paddingBottom: 8,
        marginTop: 20,
      },
      table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        marginBottom: 15,
        borderRadius: 4,
      },
      tableRow: {
        flexDirection: 'row',
      },
      tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        padding: 8,
      },
      tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
      },
      summary: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f8f8f8',
        borderRadius: 4,
      },
    });

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Reporte de Ventas</Text>
            <Text style={styles.subtitle}>
              {selectedLocation ? `Ubicación: ${locations[selectedLocation]}` : 'Todas las ubicaciones'}
            </Text>
            <Text style={styles.subtitle}>
              Del {format(startDate, "PPP", { locale: es })} al {format(endDate, "PPP", { locale: es })}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen General</Text>
            <View style={styles.summary}>
              <Text>Total de Ventas: {reportData.totalSales}</Text>
              <Text>Monto Total: ${reportData.totalAmount.toLocaleString('es-MX')} MXN</Text>
              <Text>Ticket Promedio: ${reportData.averageTicket.toLocaleString('es-MX')} MXN</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ventas por Día</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCol, { width: '40%' }]}>
                  <Text>Fecha</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text>Ventas</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text>Total</Text>
                </View>
              </View>
              {reportData.salesByDate.map((sale, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: '40%' }]}>
                    <Text>{sale.date}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '30%' }]}>
                    <Text>{sale.count}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '30%' }]}>
                    <Text>${sale.amount.toLocaleString('es-MX')} MXN</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Productos</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCol, { width: '40%' }]}>
                  <Text>Producto</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text>Cantidad</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text>Total</Text>
                </View>
              </View>
              {reportData.topProducts.map((product, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: '40%' }]}>
                    <Text>{product.name}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '30%' }]}>
                    <Text>{product.quantity}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '30%' }]}>
                    <Text>${product.total.toLocaleString('es-MX')} MXN</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Clientes</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCol, { width: '40%' }]}>
                  <Text>Cliente</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text>Compras</Text>
                </View>
                <View style={[styles.tableCol, { width: '30%' }]}>
                  <Text>Total</Text>
                </View>
              </View>
              {reportData.salesByClient.map((client, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCol, { width: '40%' }]}>
                    <Text>{client.clientName}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '30%' }]}>
                    <Text>{client.count}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: '30%' }]}>
                    <Text>${client.amount.toLocaleString('es-MX')} MXN</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Page>
      </Document>
    );
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-base">Fecha Inicial</Label>
          <DatePicker
            date={startDate}
            setDate={setStartDate}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-base">Fecha Final</Label>
          <DatePicker
            date={endDate}
            setDate={setEndDate}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-base">Ubicación</Label>
          <div className="relative">
            <select
              id="location"
              value={selectedLocation || ''}
              onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
              className="w-full pl-9 pr-4 py-2 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las ubicaciones</option>
              {Object.entries(locations).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          onClick={generateReport}
          disabled={loading || !startDate || !endDate}
          className="bg-blue-500 hover:bg-blue-600 h-10 px-6"
        >
          {loading ? 'Generando...' : 'Generar Reporte'}
        </Button>

        {reportData && pdfComponents && (
          <pdfComponents.PDFDownloadLink
            document={createPDFDocument()}
            fileName={`reporte-ventas-${startDate?.toISOString().split('T')[0]}-${endDate?.toISOString().split('T')[0]}.pdf`}
            className="inline-flex items-center gap-2 px-6 h-10 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            {({ loading: pdfLoading }: { loading: boolean }) => (
              <>
                <Download className="w-4 h-4" />
                {pdfLoading ? 'Preparando PDF...' : 'Descargar PDF'}
              </>
            )}
          </pdfComponents.PDFDownloadLink>
        )}
      </div>
    </div>
  );
};

export default SalesReportGenerator;