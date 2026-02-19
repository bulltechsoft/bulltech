'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, X, Search, Printer, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePOSStore } from '@/store/usePOSStore';

interface ReprintTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Componente Ticket Digital (compartido) ───────────────────────────────────
function DigitalTicket({ ticket, moneda = 'VES' }: { ticket: any; moneda?: string }) {
    const fecha = new Date(ticket.fecha_venta).toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const grouped = (ticket.items || []).reduce((acc: any, item: any) => {
        const lot = item.loterias?.nombre || item.loteria_nombre || 'Lotería';
        const sor = item.sorteos?.nombre || item.sorteo_nombre || 'Sorteo';
        if (!acc[lot]) acc[lot] = {};
        if (!acc[lot][sor]) acc[lot][sor] = [];
        acc[lot][sor].push(item);
        return acc;
    }, {});

    const isAnulado = ticket.estado === 'ANULADO';

    return (
        <div className="relative font-mono bg-slate-950 rounded-xl border border-white/10 overflow-hidden text-[11px]">

            {isAnulado && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-25deg]">
                    <span className="text-red-500/25 font-black text-5xl tracking-widest border-4 border-red-500/25 px-4 py-1 rounded">
                        ANULADO
                    </span>
                </div>
            )}

            {/* Cabecera */}
            <div className="text-center px-4 pt-4 pb-3 border-b border-dashed border-white/15">
                <p className="text-white font-black text-sm tracking-widest uppercase">🎰 AGENCIA DEMO</p>
                <p className="text-slate-400 text-[10px]">RIF: J-12345678-0</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{fecha}</p>
            </div>

            {/* Ticket # y estado */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-white/15">
                <div>
                    <p className="text-slate-500 text-[9px] uppercase tracking-widest">Ticket</p>
                    <p className="text-white font-bold tracking-widest">{ticket.ticket_numero || '—'}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${isAnulado
                        ? 'bg-red-900/40 text-red-400 border-red-500/30'
                        : ticket.estado === 'PAGADO'
                            ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30'
                            : 'bg-purple-900/40 text-purple-300 border-purple-500/30'
                    }`}>
                    {ticket.estado || 'ACTIVO'}
                </span>
            </div>

            {/* Jugadas */}
            <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                {Object.keys(grouped).map(loteria => (
                    <div key={loteria}>
                        <p className="text-purple-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                            {loteria}
                        </p>
                        {Object.keys(grouped[loteria]).map(sorteo => {
                            const hora = grouped[loteria][sorteo][0]?.sorteos?.hora_sorteo || '';
                            return (
                                <div key={sorteo} className="mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-px bg-white/10" />
                                        <p className="text-slate-400 text-[9px] italic whitespace-nowrap">
                                            — {sorteo}{hora ? ` (${hora})` : ''} —
                                        </p>
                                        <div className="flex-1 h-px bg-white/10" />
                                    </div>
                                    {grouped[loteria][sorteo].map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between py-0.5">
                                            <span className="text-white">
                                                <span className="text-slate-300 font-bold w-6 inline-block">
                                                    {String(item.elemento_codigo).padStart(2, '0')}
                                                </span>
                                                {' '}
                                                <span className="text-slate-400">
                                                    {item.elemento_nombre || item.elemento_codigo}
                                                </span>
                                            </span>
                                            <span className="text-white font-bold">
                                                {Number(item.monto_apuesta ?? item.monto ?? 0).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-dashed border-white/15 bg-slate-900/40">
                <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Total {moneda}:</span>
                <span className="text-white font-black text-base">{Number(ticket.monto_total ?? ticket.total ?? 0).toFixed(2)}</span>
            </div>

            {/* Pie de recibo */}
            <div className="text-center px-4 pb-3 pt-1 text-[9px] text-slate-600 uppercase tracking-wider space-y-0.5">
                <p>Caduca a los 3 días</p>
                <p>Verifique su ticket</p>
            </div>
        </div>
    );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────

export const ReprintTicketModal = ({ isOpen, onClose }: ReprintTicketModalProps) => {
    const [serialInput, setSerialInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<any | null>(null);
    const [error, setError] = useState('');

    const setLastProcessedTicket = usePOSStore(state => state.setLastProcessedTicket);

    const handleSearch = async () => {
        if (!serialInput.trim()) return;
        setLoading(true);
        setError('');
        setTicket(null);

        try {
            const { data, error: dbError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    items:detalle_tickets (
                        *,
                        loterias ( nombre ),
                        sorteos  ( nombre, hora_sorteo )
                    )
                `)
                .eq('serial_secreto', serialInput.trim().toUpperCase())
                .single();

            if (dbError) {
                setError(dbError.code === 'PGRST116' ? 'Ticket no encontrado' : 'Error al buscar el ticket');
            } else {
                // Normalizar items para que el Receipt los pueda leer
                const formattedItems = data.items.map((i: any) => ({
                    ...i,
                    loteria_nombre: i.loterias?.nombre || 'Lotería',
                    sorteo_nombre: i.sorteos?.nombre || 'Sorteo',
                    hora_sorteo: i.sorteos?.hora_sorteo || '',
                    monto: i.monto_apuesta,
                    elemento_nombre: i.elemento_codigo,
                }));
                setTicket({ ...data, items: formattedItems, total: data.monto_total });
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleReprint = () => {
        if (!ticket) return;
        setLastProcessedTicket({
            ticket_numero: ticket.ticket_numero,
            serial_secreto: ticket.serial_secreto || '––––––––',
            fecha_venta: ticket.fecha_venta,
            items: ticket.items,
            total: ticket.total,
        });
        setTimeout(() => window.print(), 100);
    };

    const handleClose = () => {
        setSerialInput('');
        setTicket(null);
        setError('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-slate-900 border border-blue-900/30 rounded-2xl shadow-2xl shadow-blue-950/40 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Glow top */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                        {/* Header */}
                        <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center bg-blue-950/20">
                            <h3 className="text-blue-400 font-bold text-base flex items-center gap-2">
                                <Printer size={18} /> Reimprimir Ticket
                            </h3>
                            <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {/* Input Serial */}
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">
                                    🔐 Serial del Ticket
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={serialInput}
                                        onChange={e => setSerialInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        placeholder="SN-A1B2C3D4"
                                        className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono text-sm tracking-widest uppercase"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading || !serialInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[52px]"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    </button>
                                </div>
                                <p className="text-[9px] text-slate-600 mt-1.5">
                                    El serial es el código de seguridad impreso en el ticket físico
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                                    <AlertTriangle size={14} className="shrink-0" /> {error}
                                </div>
                            )}

                            {/* Ticket Digital */}
                            {ticket && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <DigitalTicket ticket={ticket} />
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex-none p-4 border-t border-white/10 bg-slate-950/30 flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReprint}
                                disabled={!ticket || loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Printer size={16} /> IMPRIMIR
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
