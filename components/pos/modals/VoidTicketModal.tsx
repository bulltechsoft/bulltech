'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, X, Search, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoidTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Componente Ticket Digital (idéntico al recibo físico pero en pantalla) ──
function DigitalTicket({ ticket, moneda = 'VES' }: { ticket: any; moneda?: string }) {
    const fecha = new Date(ticket.fecha_venta).toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    // Agrupar jugadas: Lotería → Sorteo → Items
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

            {/* Marca de ANULADO */}
            {isAnulado && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-25deg]">
                    <span className="text-red-500/30 font-black text-5xl tracking-widest border-4 border-red-500/30 px-4 py-1 rounded">
                        ANULADO
                    </span>
                </div>
            )}

            {/* Cabecera Agencia */}
            <div className="text-center px-4 pt-4 pb-3 border-b border-dashed border-white/15">
                <p className="text-white font-black text-sm tracking-widest uppercase">🎰 AGENCIA DEMO</p>
                <p className="text-slate-400 text-[10px]">RIF: J-12345678-0</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{fecha}</p>
            </div>

            {/* Info del Ticket */}
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

            {/* Jugadas agrupadas */}
            <div className="px-4 py-3 space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                {Object.keys(grouped).map(loteria => (
                    <div key={loteria}>
                        {/* Nombre lotería */}
                        <p className="text-purple-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                            {loteria}
                        </p>

                        {Object.keys(grouped[loteria]).map(sorteo => {
                            const hora = grouped[loteria][sorteo][0]?.sorteos?.hora_sorteo || '';
                            return (
                                <div key={sorteo} className="mb-2">
                                    {/* Header sorteo */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-px bg-white/10" />
                                        <p className="text-slate-400 text-[9px] italic whitespace-nowrap">
                                            — {sorteo}{hora ? ` (${hora})` : ''} —
                                        </p>
                                        <div className="flex-1 h-px bg-white/10" />
                                    </div>
                                    {/* Items del sorteo */}
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

            {/* Pie */}
            <div className="text-center px-4 pb-3 pt-1 text-[9px] text-slate-600 uppercase tracking-wider space-y-0.5">
                <p>Caduca a los 3 días</p>
                <p>Verifique su ticket</p>
            </div>
        </div>
    );
}

// ─── Modal Principal ─────────────────────────────────────────────────────────

export const VoidTicketModal = ({ isOpen, onClose }: VoidTicketModalProps) => {
    const [serialInput, setSerialInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<any | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSearch = async () => {
        if (!serialInput.trim()) return;
        setLoading(true);
        setError('');
        setSuccess(false);
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
                setError(dbError.code === 'PGRST116' ? 'Ticket no encontrado' : 'Error al buscar ticket');
            } else {
                if (data.estado === 'ANULADO') setError('Este ticket ya está anulado.');
                setTicket(data);
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleVoid = async () => {
        if (!ticket) return;
        setLoading(true);
        try {
            const { error: ticketError } = await supabase
                .from('tickets')
                .update({ estado: 'ANULADO' })
                .eq('id', ticket.id);

            if (ticketError) throw ticketError;

            setSuccess(true);
            setTicket(null);
            setSerialInput('');
            setTimeout(() => { setSuccess(false); onClose(); }, 2500);
        } catch (err: any) {
            setError(`Error al anular: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSerialInput('');
        setTicket(null);
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-slate-900 border border-red-900/30 rounded-2xl shadow-2xl shadow-red-950/40 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Glow top */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

                        {/* Header */}
                        <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center bg-red-950/20">
                            <h3 className="text-red-400 font-bold text-base flex items-center gap-2">
                                <Trash2 size={18} /> Anular Ticket
                            </h3>
                            <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {!success ? (
                                <>
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
                                                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 transition-colors font-mono text-sm tracking-widest uppercase"
                                            />
                                            <button
                                                onClick={handleSearch}
                                                disabled={loading || !serialInput.trim()}
                                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-white/10 min-w-[52px]"
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
                                            className="space-y-3"
                                        >
                                            <DigitalTicket ticket={ticket} />

                                            {ticket.estado !== 'ANULADO' && (
                                                <button
                                                    onClick={handleVoid}
                                                    disabled={loading}
                                                    className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {loading
                                                        ? <><Loader2 size={18} className="animate-spin" /> Anulando...</>
                                                        : <><Trash2 size={18} /> CONFIRMAR ANULACIÓN</>
                                                    }
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-10 text-center"
                                >
                                    <CheckCircle size={52} className="text-emerald-400 mb-4" />
                                    <h3 className="text-white font-bold text-lg mb-1">¡Ticket Anulado!</h3>
                                    <p className="text-slate-400 text-sm">El ticket ha sido anulado exitosamente.</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
