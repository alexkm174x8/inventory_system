"use client"

import React, { useState, useEffect } from 'react'; 
import { useRouter, useParams } from 'next/navigation'; 
import VentaViewDetails from '@/components/VentaViewDetails';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/userId';   

interface SaleItem { 
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    attributes?: Record<string, string>;
}

interface Venta {
    id: string;
    createdAt: string;
    items: SaleItem[];
    discount: number;
    subtotal: number;
    total: number;
}


export default function Page() {
    const router = useRouter();
    const { id } = useParams(); 
    const [venta, setVenta] = useState<Venta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchSaleDetails = async () => {
            try {
                setLoading(true);
                const userId = await getUserId();

                const { data: saleData, error: salesError } = await supabase
                    .from('sales')
                    .select(`
            *,
            sales_items:sales_items(
              *,
              variant:variant_id(
                *,
                product:product_id(*)
              )
            )
          `)
                    .eq('id', parseInt(id, 10)) 
                    .eq('user_id', userId)
                    .single();

                if (salesError) throw salesError;

                if (!saleData) {
                    setError("Venta no encontrada");
                    setLoading(false);
                    return;
                }
                const variantAttributes: Record<number, Record<string, string>> = {}; 
                const transformedSale: Venta = {
                    id: saleData.id.toString(),
                    createdAt: saleData.created_at,
                    items: saleData.sales_items?.map((item: any) => {
                        let itemAttributes: Record<string, string> = {};
                        if (item.variant?.product?.characteristics_options) {
                            itemAttributes = item.variant.product.characteristics_options.reduce((acc: Record<string, string>, option: any) => {
                                if (option.product_characteristics?.name && option.values) {
                                    acc[option.product_characteristics.name] = option.values;
                                }
                                return acc;
                            }, {});
                        }
                        return {
                            id: item.id,
                            name: item.variant?.product?.name || 'Unknown Product',
                            quantity: item.quantity_sold,
                            unitPrice: item.sale_price,
                            attributes: itemAttributes, 
                        };
                    }) || [],
                    discount: saleData.discount_percentage || 0,
                    subtotal: saleData.total_amount, 
                    total: saleData.total_amount,
                };
                setVenta(transformedSale);
                setLoading(false);
            } catch (error: any) {
                setError(error.message || "Error al cargar la venta");
                setLoading(false);
            }
        };

        fetchSaleDetails();
    }, [id]);

    const handleClose = () => {
        router.push("/ventas"); 
    };

    if (loading) {
        return <div className="text-center">Cargando detalles de la venta...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    if (!venta) {
        return <div className="text-center">No se pudo encontrar la venta.</div>;
    }

    return (
        <VentaViewDetails venta={venta} onClose={handleClose} />
    );
}