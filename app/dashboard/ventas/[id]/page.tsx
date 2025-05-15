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

interface ProductCharacteristic {
    name: string;
}

interface CharacteristicOption {
    product_characteristics: ProductCharacteristic;
    values: string;
}

interface Product {
    name: string;
    characteristics_options?: CharacteristicOption[];
}

interface Variant {
    product?: Product;
}

interface SalesItem {
    id: number;
    variant?: Variant;
    quantity_sold: number;
    sale_price: number;
}

interface Client {
    id: number;
    name: string;
}

interface Venta {
    id: string;
    createdAt: string;
    items: SaleItem[];
    discount: number;
    subtotal: number;
    total: number;
    clientId: number | null;
    clientName: string;
    locationId: number;
    employeeName: string;
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

                const { data: venta, error } = await supabase
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
                        clients:client(id, name)
                    `)
                    .eq('id', parseInt(id as string, 10)) 
                    .eq('user_id', userId)
                    .single();

                if (error) throw error;

                if (!venta) {
                    setError("Venta no encontrada");
                    setLoading(false);
                    return;
                }

                const transformedSale: Venta = {
                    id: venta.id.toString(),
                    createdAt: venta.created_at,
                    items: venta.sales_items?.map((item: SalesItem) => {
                        let itemAttributes: Record<string, string> = {};
                        if (item.variant?.product?.characteristics_options) {
                            itemAttributes = item.variant.product.characteristics_options.reduce((acc: Record<string, string>, option: CharacteristicOption) => {
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
                    discount: venta.discount_percentage || 0,
                    subtotal: venta.total_amount, 
                    total: venta.total_amount,
                    clientId: venta.client,
                    clientName: venta.clients?.name || 'Sin cliente',
                    locationId: venta.location,
                    employeeName: venta.salesman || 'Empleado no registrado'
                };
                setVenta(transformedSale);
                setLoading(false);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : "Error al cargar la venta";
                setError(errorMessage);
                setLoading(false);
            }
        };

        fetchSaleDetails();
    }, [id]);

    const handleClose = () => {
        router.push("/dashboard/ventas"); 
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1366D9]"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    if (!venta) {
        return <div className="text-center">No se pudo encontrar la venta.</div>;
    }

    return (
        <div className='h-full m-5'>
            <VentaViewDetails venta={venta} onClose={handleClose} />
        </div>
    );
}