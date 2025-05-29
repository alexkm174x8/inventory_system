import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { getUserId, getUserRole } from '@/lib/userId';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Venta {
  id: string;
  createdAt: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    attributes?: Record<string, string>;
    variant_id?: number;
  }[];
  discount: number;
  subtotal: number;
  total: number;
  locationId?: number;
  locationName?: string;
  clientId?: number | null;
  clientName?: string;
  employeeName: string;
}

interface VentaViewDetailsProps {
  venta: Venta;
  onClose: () => void;
}

const VentaViewDetails: React.FC<VentaViewDetailsProps> = ({ venta, onClose }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const fecha = new Date(venta.createdAt);

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

  const handleDeleteSale = async () => {
    try {
      setIsDeleting(true);
      const userId = await getUserId();

      // If there's a client, update their balance and sales statistics
      if (venta.clientId) {
        // Get current client data
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('saldo, num_compras, total_compras')
          .eq('id', venta.clientId)
          .single();

        if (clientError) throw clientError;

        // Calculate new values
        const currentBalance = clientData?.saldo || 0;
        const newBalance = currentBalance - venta.total; // Subtract the sale amount
        const currentNumCompras = clientData?.num_compras || 0;
        const currentTotalCompras = clientData?.total_compras || 0;
        const newNumCompras = Math.max(0, currentNumCompras - 1);
        const newTotalCompras = Math.max(0, currentTotalCompras - venta.total);

        // Update client data
        const { error: updateError } = await supabase
          .from('clients')
          .update({ 
            saldo: newBalance,
            num_compras: newNumCompras,
            total_compras: newTotalCompras
          })
          .eq('id', venta.clientId);

        if (updateError) throw updateError;
      }

      // Return items to inventory
      for (const item of venta.items) {
        if (item.variant_id) {
          // Get current stock
          const { data: stockData, error: stockFetchError } = await supabase
            .from('stock')
            .select('stock')
            .eq('variant_id', item.variant_id)
            .eq('location', venta.locationId)
            .single();

          if (stockFetchError) throw stockFetchError;

          // Update stock
          const { error: stockError } = await supabase
            .from('stock')
            .update({ stock: (stockData?.stock || 0) + item.quantity })
            .eq('variant_id', item.variant_id)
            .eq('location', venta.locationId);

          if (stockError) throw stockError;
        }
      }

      // Delete sale items first (due to foreign key constraint)
      const { error: itemsError } = await supabase
        .from('sales_items')
        .delete()
        .eq('sale_id', venta.id);

      if (itemsError) throw itemsError;

      // Delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', venta.id)
        .eq('user_id', userId);

      if (saleError) throw saleError;

      toast({
        title: "¡Éxito!",
        description: "La venta ha sido eliminada exitosamente",
      });

      router.push('/dashboard/ventas');
    } catch (err) {
      console.error('Error deleting sale:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la venta. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatItemWithAttributes = (item: Venta['items'][0]) => {
    if (!item.attributes || Object.keys(item.attributes).length === 0) {
      return item.name;
    }
    
    const attributesList = Object.entries(item.attributes).map(([key, value]) => (
      <span key={key} className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600 mr-1">
        {key}: {value}
      </span>
    ));
    
    return (
      <div>
        <div>{item.name}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {attributesList}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <Card className="w-full">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3">
            <h1 className="text-lg font-semibold capitalize">Venta</h1>
            <div className="flex items-center gap-2">
              <p className="text-lg font-light flex items-center gap-2">
                ID #{venta.id}
              </p>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Venta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente la venta
                        y se actualizará el inventario y el saldo del cliente si corresponde.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSale}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="mt-3 mb-3">
            <h2 className="text-base font-semibold">Detalles principales</h2>
          </div>
          <div className="grid grid-cols-2 ">
            <p><strong>Fecha:</strong> {fecha.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {fecha.toLocaleTimeString()}</p>
            {venta.locationName && (
              <p><strong>Ubicación:</strong> {venta.locationName}</p>
            )}
            <p><strong>Cliente:</strong> {venta.clientName || 'Sin cliente'}</p>
            <p><strong>Vendedor:</strong> {venta.employeeName}</p>
          </div>
          <div className="mt-2">
            <h2 className="text-base font-semibold">Productos</h2>
            <ul className="mt-3">
              {venta.items.map((item, index) => (
                <li key={index} className="flex justify-between border-b py-1">
                  <div className="flex">
                    <span className="mr-2">{item.quantity} x</span>
                    <div>{formatItemWithAttributes(item)}</div>
                  </div>
                  <span className="ml-auto">MXN ${item.unitPrice * item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3 mb-3">
            <p><strong>Subtotal:</strong> MXN ${venta.subtotal}</p>
            <p><strong>Descuento:</strong> {venta.discount}%</p>
          </div>
          <div>
            <p><strong>Total:</strong> MXN ${venta.total}</p>
          </div>
          <div className="text-center mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-20">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VentaViewDetails;