'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePOSStore } from '@/store/usePOSStore';
import {
    Loader2, X, Search, AlertTriangle, RefreshCw,
    ChevronRight, CheckCircle2, ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RepeatTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface SorteoOption {
    id: string;
    nombre: string;
    hora_sorteo: string;
}

interface LotGroup {
    loteria_id: string;
    loteria_nombre: string;
    items: any[];                    // detalle_tickets originales
    sorteos_disponibles: SorteoOption[];
    sorteo_elegido: SorteoOption | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtHora(h: string) {
    if (!h) return '';
    try {
        const [hh, mm] = h.split(':');
        const d = new Date();
        d.setHours(Number(hh), Number(mm));
        return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return h; }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export const RepeatTicketModal = ({ isOpen, onClose }: RepeatTicketModalProps) => {
    const addToTicket = usePOSStore(s => s.addToTicket);
    const clearTicket = usePOSStore(s => s.clearTicket);

    const [ticketNum, setTicketNum] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSorteos, setLoadingSorteos] = useState(false);
    const [lotGroups, setLotGroups] = useState<LotGroup[]>([]);
    const [ticketInfo, setTicketInfo] = useState<{ ticket_numero: string; total: number; fecha: string } | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // ── Buscar ticket por ticket_numero ──────────────────────────────────────
    const handleSearch = async () => {
        if (!ticketNum.trim()) return;
        setLoading(true);
        setError('');
        setLotGroups([]);
        setTicketInfo(null);
        setSuccess(false);

        try {
            const { data, error: dbErr } = await supabase
                .from('tickets')
                .select(`
                    id, ticket_numero, monto_total, fecha_venta, estado,
                    items:detalle_tickets (
                        id, elemento_codigo, monto_apuesta, premio_estimado,
                        loteria_id,
                        loterias ( nombre ),
                        sorteo_id,
                        sorteos  ( nombre, hora_sorteo )
                    )
                `)
                .eq('ticket_numero', ticketNum.trim().toUpperCase())
                .single();

            if (dbErr) {
                setError(dbErr.code === 'PGRST116' ? 'Ticket no encontrado.' : 'Error al buscar el ticket.');
                return;
            }

            if ((data.items || []).length === 0) {
                setError('Este ticket no tiene jugadas registradas.');
                return;
            }

            setTicketInfo({
                ticket_numero: data.ticket_numero,
                total: Number(data.monto_total),
                fecha: new Date(data.fecha_venta).toLocaleDateString('es-VE'),
            });

            // Agrupar items por lotería
            const grouped: Record<string, LotGroup> = {};
            for (const item of (data.items as any[])) {
                const lid = item.loteria_id;
                if (!grouped[lid]) {
                    grouped[lid] = {
                        loteria_id: lid,
                        loteria_nombre: item.loterias?.nombre || 'Lotería',
                        items: [],
                        sorteos_disponibles: [],
                        sorteo_elegido: null,
                    };
                }
                grouped[lid].items.push(item);
            }

            // Para cada lotería, cargar los sorteos disponibles
            setLoadingSorteos(true);
            const groups = Object.values(grouped);
            await Promise.all(groups.map(async (g) => {
                const { data: sorteos } = await supabase
                    .from('sorteos')
                    .select('id, nombre, hora_sorteo')
                    .eq('loteria_id', g.loteria_id)
                    .eq('activo', true)
                    .order('hora_sorteo', { ascending: true });

                g.sorteos_disponibles = sorteos || [];
                // Pre-seleccionar primero disponible
                if (g.sorteos_disponibles.length > 0) g.sorteo_elegido = g.sorteos_disponibles[0];
            }));
            setLoadingSorteos(false);

            setLotGroups(groups);
        } catch (e: any) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // ── Cambiar sorteo elegido en un grupo ───────────────────────────────────
    const setSorteo = (loteria_id: string, sorteo: SorteoOption) => {
        setLotGroups(prev =>
            prev.map(g => g.loteria_id === loteria_id ? { ...g, sorteo_elegido: sorteo } : g)
        );
    };

    // ── Cargar al carrito ────────────────────────────────────────────────────
    const handleRepeat = () => {
        // Validar que todos los grupos tienen sorteo elegido
        const missing = lotGroups.filter(g => !g.sorteo_elegido);
        if (missing.length > 0) {
            setError(`Elige un sorteo para: ${missing.map(g => g.loteria_nombre).join(', ')}`);
            return;
        }

        clearTicket(); // Comienza con el carrito vacío

        for (const group of lotGroups) {
            const sorteo = group.sorteo_elegido!;
            for (const item of group.items) {
                addToTicket({
                    loteria_id: group.loteria_id,
                    loteria_nombre: group.loteria_nombre,
                    sorteo_id: sorteo.id,
                    sorteo_nombre: sorteo.nombre,
                    hora_sorteo: sorteo.hora_sorteo,
                    elemento_codigo: item.elemento_codigo,
                    elemento_nombre: item.elemento_codigo,   // code = nombre si no hay lookup
                    monto: Number(item.monto_apuesta),
                    premio_estimado: Number(item.premio_estimado ?? item.monto_apuesta * 30),
                });
            }
        }

        setSuccess(true);
        setTimeout(() => { handleClose(); }, 1800);
    };

    const handleClose = () => {
        setTicketNum('');
        setLotGroups([]);
        setTicketInfo(null);
        setError('');
        setSuccess(false);
        onClose();
    };

    const allReady = lotGroups.length > 0 && lotGroups.every(g => g.sorteo_elegido);
    const totalItems = lotGroups.reduce((s, g) => s + g.items.length, 0);

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
                        className="relative w-full max-w-sm bg-slate-900 border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Glow top */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                        {/* ── Header ── */}
                        <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center bg-purple-950/20">
                            <h3 className="text-purple-300 font-bold text-base flex items-center gap-2">
                                <RefreshCw size={17} /> Repetir Ticket
                            </h3>
                            <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            {!success ? (
                                <>
                                    {/* Input N° Ticket */}
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 block">
                                            🎟 Número de Ticket
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={ticketNum}
                                                onChange={e => setTicketNum(e.target.value.toUpperCase())}
                                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                                placeholder="TN-000018"
                                                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-sm tracking-widest uppercase"
                                            />
                                            <button
                                                onClick={handleSearch}
                                                disabled={loading || !ticketNum.trim()}
                                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[52px]"
                                            >
                                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-1.5">
                                            El número de ticket está impreso en el comprobante del cliente (ej: TN-000018)
                                        </p>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                                            <AlertTriangle size={14} className="shrink-0" /> {error}
                                        </div>
                                    )}

                                    {/* Info del ticket original */}
                                    {ticketInfo && (
                                        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/8 flex justify-between items-center">
                                            <div>
                                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Ticket original</p>
                                                <p className="text-white font-bold text-sm font-mono">{ticketInfo.ticket_numero}</p>
                                                <p className="text-slate-500 text-[10px] mt-0.5">{ticketInfo.fecha} · {totalItems} jugadas</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Total</p>
                                                <p className="text-purple-300 font-black text-lg">
                                                    {ticketInfo.total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cargando sorteos */}
                                    {loadingSorteos && (
                                        <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            Cargando sorteos disponibles...
                                        </div>
                                    )}

                                    {/* ── Grupos por Lotería ── */}
                                    {lotGroups.length > 0 && !loadingSorteos && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                Elige el nuevo sorteo por lotería
                                            </p>

                                            {lotGroups.map(group => (
                                                <div key={group.loteria_id} className="rounded-xl border border-white/8 overflow-hidden">
                                                    {/* Lotería header */}
                                                    <div className="px-3 py-2.5 bg-purple-950/40 border-b border-white/8 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-purple-300 font-bold text-xs uppercase tracking-wide">
                                                                {group.loteria_nombre}
                                                            </p>
                                                            <p className="text-slate-500 text-[9px] mt-0.5">
                                                                {group.items.length} jugada{group.items.length !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                        {group.sorteo_elegido && (
                                                            <span className="text-[9px] bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                                                                ✓ {group.sorteo_elegido.nombre}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Jugadas del grupo (compactas) */}
                                                    <div className="px-3 py-2 space-y-1 max-h-28 overflow-y-auto custom-scrollbar bg-slate-950/30">
                                                        {group.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-[11px]">
                                                                <span className="text-white">
                                                                    <span className="font-bold text-purple-300 w-6 inline-block">
                                                                        {String(item.elemento_codigo).padStart(2, '0')}
                                                                    </span>
                                                                </span>
                                                                <span className="text-slate-400 font-semibold">
                                                                    Bs. {Number(item.monto_apuesta).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Selector de sorteos */}
                                                    <div className="px-3 pb-3 pt-2">
                                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">
                                                            Selecciona el sorteo
                                                        </p>
                                                        {group.sorteos_disponibles.length === 0 ? (
                                                            <p className="text-red-400 text-[10px]">No hay sorteos activos disponibles.</p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {group.sorteos_disponibles.map(s => {
                                                                    const elegido = group.sorteo_elegido?.id === s.id;
                                                                    return (
                                                                        <button
                                                                            key={s.id}
                                                                            onClick={() => setSorteo(group.loteria_id, s)}
                                                                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${elegido
                                                                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30 scale-[1.02]'
                                                                                    : 'bg-slate-800/60 border-white/8 text-slate-400 hover:text-white hover:border-white/20'
                                                                                }`}
                                                                        >
                                                                            {fmtHora(s.hora_sorteo)}
                                                                            {s.nombre !== s.hora_sorteo && (
                                                                                <span className="ml-1 opacity-60">{s.nombre}</span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Resumen de lo que se va a cargar */}
                                            {allReady && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="p-3 rounded-xl bg-purple-900/15 border border-purple-500/20 space-y-1"
                                                >
                                                    <p className="text-[9px] text-purple-400 uppercase tracking-widest font-bold">Se cargará en el carrito</p>
                                                    {lotGroups.map(g => (
                                                        <div key={g.loteria_id} className="flex justify-between text-[10px]">
                                                            <span className="text-slate-300">
                                                                {g.loteria_nombre}
                                                                <ChevronRight size={10} className="inline mx-0.5 text-slate-500" />
                                                                <span className="text-purple-300">{g.sorteo_elegido!.nombre} {fmtHora(g.sorteo_elegido!.hora_sorteo)}</span>
                                                            </span>
                                                            <span className="text-slate-400">{g.items.length} jugadas</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                /* ── Pantalla de éxito ── */
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-10 text-center"
                                >
                                    <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mb-4">
                                        <ShoppingCart size={36} className="text-purple-400" />
                                    </div>
                                    <h3 className="text-white font-black text-xl mb-1">¡Carrito listo!</h3>
                                    <p className="text-slate-400 text-sm">{totalItems} jugadas cargadas al ticket.</p>
                                    <p className="text-slate-600 text-xs mt-1">Revisa y confirma la apuesta en el POS.</p>
                                </motion.div>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        {!success && (
                            <div className="flex-none p-4 border-t border-white/10 bg-slate-950/30 flex justify-end gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRepeat}
                                    disabled={!allReady}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <RefreshCw size={15} />
                                    CARGAR AL TICKET
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
