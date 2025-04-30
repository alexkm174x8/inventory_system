'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';
import { useRouter, useParams } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface InventoryItem {
  id: number;
  variant_id: number;
  productName: string;
  quantity: number;
  entryDate: string;
  ubicacion_nombre: string;
  caracteristicas: { name: string; value: string }[];
  unitPrice?: number;
  imageUrl?: string | null;
  attributes?: any[];
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

interface ProductDetailViewProps {
  onClose: () => void;
}

interface ProductDetailPageParams {
  id?: string;
  [key: string]: string | string[] | undefined; 
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ onClose }) => {
  const router = useRouter();
  const { id: productId } = useParams<ProductDetailPageParams>(); // Obtén el id aquí
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProductDetails = async () => {
      if (!productId) {
        setError('ID de producto no proporcionado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('Usuario no autenticado.');

        const { data, error: supaErr } = await supabase
          .from('stock')
          .select(`
            id,
            variant_id,
            stock,
            added_at,
            locations ( name ),
            productVariants (
              products (
                name,
                product_characteristics ( name, characteristics_id )
              ),
              optionVariants (
                characteristics_options ( values, characteristics_id )
              )
            )
          `)
          .eq('user_id', userId)
          .eq('id', productId)
          .single()
          .returns<SupabaseStockItem>();

        if (supaErr) throw supaErr;

        if (data) {
          const prod = data.productVariants?.products;
          const opts = data.productVariants?.optionVariants ?? [];
          const loc = data.locations?.name ?? '—';

          const chars = opts.map(o => {
            const co = o.characteristics_options;
            const pc = prod?.product_characteristics.find(
              pc => pc.characteristics_id === co?.characteristics_id
            );
            return {
              name: pc?.name ?? 'Cualquiera',
              value: co?.values ?? ''
            };
          });          
          

          setProduct({
            id: data.id,
            variant_id: data.variant_id,
            productName: prod?.name ?? '—',
            quantity: data.stock,
            entryDate: new Date(data.added_at).toLocaleDateString(),
            ubicacion_nombre: loc,
            caracteristicas: chars
          });
        } else {
          setError('Producto no encontrado.');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#1366D9]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">{error}</div>
    );
  }

  if (!product) {
    return <div>No se encontraron detalles del producto.</div>;
  }

  return (
    <div className="h-full">
      <Card className="w-full overflow-hidden mt-6">
        <CardContent>
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between mt-3 flex-wrap gap-2">
            <h1 className="text-2xl font-bold">{product.productName}</h1>
            <p className="text-lg font-light flex items-center gap-2">
              ID #{product.id}
            </p>
          </div>
          <div className="mt-3 mb-3 ">
          <h2 className=" font-semibold">Detalles principales</h2>
          </div>
          <div className=" mb-3 mt-3">
            <p><strong>Cantidad: </strong> {product.quantity}</p>
            <p><strong>Ubicación:</strong> {product.ubicacion_nombre}</p>
            <p><strong> Fecha de Entrada:</strong> {product.entryDate}</p>
          </div>
          {product.caracteristicas.length > 0 && (
          <div>
            <div className="mb-3 mt-3">
            <h2 className="font-semibold">Características</h2>
            </div>
            <ul>
              {product.caracteristicas.map((char, index) => (
                <li key={index}>
                  <p className='text-lg'>
                    <strong>{char.name}:</strong> {char.value}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

          <div className="text-center mt-6">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductDetailView;
