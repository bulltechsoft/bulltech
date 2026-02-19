'use client';

import { useState } from 'react';
import { TicketReceipt } from './TicketReceipt';
import { usePOSStore } from '@/store/usePOSStore';
import { Printer, Trash2, X, CreditCard, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

export const TicketCart = () => {
    const items = usePOSStore(state => state.ticketItems);
    const removeItem = usePOSStore(state => state.removeFromTicket);
    const clearCart = usePOSStore(state => state.clearTicket);
    const total = usePOSStore(state => state.totalVenta());
    const moneda = usePOSStore(state => state.monedaOperacion);
    const setLastProcessedTicket = usePOSStore(state => state.setLastProcessedTicket);

    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcessPayment = async () => {
        if (items.length === 0) return;
        setIsProcessing(true);

        try {
            // 1. Preparar Payload para RPC
            // NOTA: En produccion IDs deben venir de Auth/Context
            const payload = {
                p_comercializadora_id: 'd9e0f3a4-8b6a-4d3c-9e2f-1a2b3c4d5e6f', // Mock/Admin ID
                p_taquilla_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // Mock/Taquilla ID
                p_moneda: moneda,
                p_items: items.map(i => ({
                    loteria_id: i.loteria_id,
                    sorteo_id: i.sorteo_id,
                    elemento_codigo: i.elemento_codigo,
                    monto: i.monto
                }))
            };

            // 2. Llamar RPC (Simulado por ahora para fallback, pero intentamos RPC real si existe)
            // const { data, error } = await supabase.rpc('procesar_apuesta', payload);

            // SIMULACION DE EXITO (Para demo frontend sin backend full configurado)
            // En implementacion real, descomentar RPC arriba y usar data
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockResponse = {
                serial: Math.random().toString(36).substr(2, 10).toUpperCase(),
                numero_ticket: Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
                fecha_venta: new Date().toISOString(),
                total: total
            };

            // 3. Exito
            setLastProcessedTicket({
                serial: mockResponse.serial,
                numero_ticket: mockResponse.numero_ticket,
                fecha_venta: mockResponse.fecha_venta,
                items: [...items], // Guardamos copia de items procesados para el recibo
                total: total
            });

            // 4. Imprimir y Limpiar
            setTimeout(() => {
                window.print();
                // Opcional: limpiar despues de imprimir
                // clearCart(); 
            }, 100);

        } catch (error) {
            console.error('Error procesando:', error);
            alert('Error al procesar la venta. Intente de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-full bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative">
            {/* ... Header & Items ... */}
            <div className="flex-none p-4 pb-2 border-b border-white/5 flex justify-between items-center bg-slate-950/30 backdrop-blur-sm z-10">
                <div>
                    <h2 className="text-white font-bold text-lg tracking-tight">Ticket de Venta</h2>
                    <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Taquilla 01</span>
                        <span>{items.length} Jugadas</span>
                    </div>
                </div>
                {items.length > 0 && (
                    <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-900/20 px-3 py-1.5 rounded-full border border-red-500/20 transition-all hover:bg-red-900/40">
                        <X size={14} /> Limpiar
                    </button>
                )}
            </div>

            {/* Cart Items - Scrollable Area */}
            {/* min-h-0 is CRITICAL for nested flex scrolling */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2 custom-scrollbar bg-slate-950/20 relative">
                <AnimatePresence initial={false} mode='popLayout'>
                    {items.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -10 }}
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 group hover:bg-slate-800/60 transition-all hover:border-white/10 shadow-sm shrink-0"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-white w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-lg shadow-purple-900/30">
                                    {item.elemento_codigo}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm text-white font-bold tracking-wide">{item.elemento_nombre}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{item.loteria_nombre} • {item.sorteo_nombre}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-white font-mono font-bold text-lg tracking-tight">{item.monto.toFixed(2)}</span>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    disabled={isProcessing}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {items.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-30 pointer-events-none">
                        <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-600 mb-4 animate-pulse-slow" />
                        <p className="text-sm font-medium uppercase tracking-widest">Ticket Vacío</p>
                    </div>
                )}
            </div>

            {/* Footer Totals - Fixed at bottom */}
            <div className="flex-none p-4 bg-slate-950/50 border-t border-white/10 backdrop-blur-md z-10 w-full">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total a Pagar</span>
                    <div className="text-right">
                        <span className="text-xs text-slate-500 mr-1">{moneda}</span>
                        <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                            {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleProcessPayment}
                    disabled={items.length === 0 || isProcessing}
                    className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-bold text-lg shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            <span className="tracking-widest text-sm">PROCESANDO...</span>
                        </>
                    ) : (
                        <>
                            <CreditCard size={24} className="group-hover:rotate-12 transition-transform" />
                            <span className="tracking-wide">PROCESAR APUESTA</span>
                        </>
                    )}
                </button>
            </div>

            {/* Hidden Receipt Component */}
            <TicketReceipt />
        </div>
    );
};
