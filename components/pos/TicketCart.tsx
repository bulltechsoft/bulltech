'use client';

import { TicketReceipt } from './TicketReceipt';
import { usePOSStore } from '@/store/usePOSStore';
import { Printer, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const TicketCart = () => {
    const items = usePOSStore(state => state.ticketItems);
    const removeItem = usePOSStore(state => state.removeFromTicket);
    const clearCart = usePOSStore(state => state.clearTicket);
    const total = usePOSStore(state => state.totalVenta());
    const moneda = usePOSStore(state => state.monedaOperacion);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full">
            {/* ... Header & Items ... */}
            <div className="mb-4 pb-4 border-b border-white/10 flex justify-between items-start">
                <div>
                    <h2 className="text-white font-bold text-lg">Ticket Actual</h2>
                    <div className="flex gap-2 text-xs text-slate-400 mt-1">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Taquilla 01</span>
                        <span>{items.length} Jugadas</span>
                    </div>
                </div>
                {items.length > 0 && (
                    <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-500/20">
                        <X size={12} /> Limpiar
                    </button>
                )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {items.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-purple-400 w-8 text-center bg-purple-900/20 rounded">{item.elemento_codigo}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm text-white font-medium">{item.elemento_nombre}</span>
                                    <span className="text-[10px] text-slate-500">{item.loteria_nombre} • {item.sorteo_nombre}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-white font-mono font-bold">{item.monto.toFixed(2)}</span>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {items.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 mb-2" />
                        <p className="text-sm">Ticket Vacío</p>
                    </div>
                )}
            </div>

            {/* Footer Totals */}
            <div className="mt-auto pt-4 space-y-3 border-t border-white/10 bg-slate-900/50 -mx-4 px-4 -mb-4 py-4 backdrop-blur-md">
                <div className="flex justify-between items-end">
                    <span className="text-slate-400 text-sm">Total {moneda}</span>
                    <span className="text-3xl font-bold text-white font-mono tracking-tighter">
                        {total.toFixed(2)}
                    </span>
                </div>

                <button
                    onClick={handlePrint}
                    disabled={items.length === 0}
                    className="w-full h-14 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold text-lg shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                    <Printer size={20} />
                    IMPRIMIR
                </button>
            </div>

            {/* Hidden Receipt Component */}
            <TicketReceipt />
        </div>
    );
};
