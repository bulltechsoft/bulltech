'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, X, Search, AlertTriangle, DollarSign, CheckCircle, Clock, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PayTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ─── Ticket Digital idéntico al recibo (reutilizado) ─────────────────────────
function DigitalTicket({ ticket, moneda = 'VES' }: { ticket: any; moneda?: string }) {
    const fecha = new Date(ticket.fecha_venta).toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const grouped = (ticket.items || []).reduce((acc: any, item: any) => {
        const lot = item.loterias?.nombre || 'Lotería';
        const sor = item.sorteos?.nombre || 'Sorteo';
        if (!acc[lot]) acc[lot] = {};
        if (!acc[lot][sor]) acc[lot][sor] = [];
        acc[lot][sor].push(item);
        return acc;
    }, {});

    const estado = ticket.estado || 'ACTIVO';
    const isAnulado = estado === 'ANULADO';
    const isPagado = estado === 'PAGADO';
    const isGanador = estado === 'GANADOR';

    const badgeStyle = isAnulado ? 'bg-red-900/40 text-red-400 border-red-500/30'
        : isPagado ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30'
            : isGanador ? 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30'
                : 'bg-purple-900/40 text-purple-300 border-purple-500/30';

    return (
        <div className="relative font-mono bg-slate-950 rounded-xl border border-white/10 overflow-hidden text-[11px]">

            {isAnulado && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-25deg]">
                    <span className="text-red-500/25 font-black text-5xl tracking-widest border-4 border-red-500/25 px-4 py-1 rounded">ANULADO</span>
                </div>
            )}
            {isPagado && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-25deg]">
                    <span className="text-emerald-500/20 font-black text-5xl tracking-widest border-4 border-emerald-500/20 px-4 py-1 rounded">PAGADO</span>
                </div>
            )}

            {/* Cabecera */}
            <div className="text-center px-4 pt-4 pb-3 border-b border-dashed border-white/15">
                <p className="text-white font-black text-sm tracking-widest uppercase">🎰 AGENCIA DEMO</p>
                <p className="text-slate-400 text-[10px]">RIF: J-12345678-0</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{fecha}</p>
            </div>

            {/* N° y Estado */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-white/15">
                <div>
                    <p className="text-slate-500 text-[9px] uppercase tracking-widest">Ticket</p>
                    <p className="text-white font-bold tracking-widest">{ticket.ticket_numero || '—'}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${badgeStyle}`}>
                    {estado}
                </span>
            </div>

            {/* Jugadas */}
            <div className="px-4 py-3 space-y-3 max-h-52 overflow-y-auto custom-scrollbar">
                {Object.keys(grouped).map(loteria => (
                    <div key={loteria}>
                        <p className="text-purple-400 font-bold text-[10px] uppercase tracking-wider mb-1">{loteria}</p>
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
                                            <span>
                                                <span className="text-slate-300 font-bold w-6 inline-block">
                                                    {String(item.elemento_codigo).padStart(2, '0')}
                                                </span>
                                                {' '}<span className="text-slate-400">{item.elemento_nombre || item.elemento_codigo}</span>
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

            {/* Total apostado */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-dashed border-white/15 bg-slate-900/40">
                <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Total {moneda}:</span>
                <span className="text-white font-black text-base">{Number(ticket.monto_total ?? ticket.total ?? 0).toFixed(2)}</span>
            </div>

            {/* Premio (solo si es GANADOR o PAGADO) */}
            {(isGanador || isPagado) && ticket.premio_total > 0 && (
                <div className={`flex justify-between items-center px-4 py-3 border-t border-dashed border-white/15 ${isPagado ? 'bg-emerald-900/10' : 'bg-yellow-900/20'}`}>
                    <span className={`uppercase font-bold text-[10px] tracking-wider ${isPagado ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        🏆 Premio a Pagar:
                    </span>
                    <span className={`font-black text-lg ${isPagado ? 'text-emerald-300' : 'text-yellow-300'}`}>
                        {Number(ticket.premio_total).toFixed(2)}
                    </span>
                </div>
            )}

            <div className="text-center px-4 pb-3 pt-1 text-[9px] text-slate-600 uppercase tracking-wider space-y-0.5">
                <p>Caduca a los 3 días · Verifique su ticket</p>
            </div>
        </div>
    );
}

// ─── Status Banner component ──────────────────────────────────────────────────
function StatusBanner({ estado }: { estado: string }) {
    if (estado === 'GANADOR') return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-900/20 border border-yellow-500/30">
            <div className="p-2 rounded-lg bg-yellow-500/15 shrink-0"><DollarSign size={16} className="text-yellow-400" /></div>
            <div>
                <p className="text-yellow-300 font-bold text-xs">🏆 ¡Ticket Premiado!</p>
                <p className="text-yellow-500/70 text-[10px]">Este ticket tiene un premio pendiente de cobro. Confirma el pago al cliente.</p>
            </div>
        </div>
    );
    if (estado === 'PAGADO') return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-900/20 border border-emerald-500/30">
            <div className="p-2 rounded-lg bg-emerald-500/15 shrink-0"><CheckCircle size={16} className="text-emerald-400" /></div>
            <div>
                <p className="text-emerald-300 font-bold text-xs">✅ Premio ya pagado</p>
                <p className="text-emerald-500/70 text-[10px]">El premio de este ticket ya fue entregado al cliente.</p>
            </div>
        </div>
    );
    if (estado === 'ANULADO') return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-900/20 border border-red-500/30">
            <div className="p-2 rounded-lg bg-red-500/15 shrink-0"><Ban size={16} className="text-red-400" /></div>
            <div>
                <p className="text-red-300 font-bold text-xs">🚫 Ticket Anulado</p>
                <p className="text-red-500/70 text-[10px]">Este ticket fue anulado y no puede recibir pagos.</p>
            </div>
        </div>
    );
    // PENDIENTE / ACTIVO
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/10">
            <div className="p-2 rounded-lg bg-slate-700/50 shrink-0"><Clock size={16} className="text-slate-400" /></div>
            <div>
                <p className="text-slate-300 font-bold text-xs">⏳ Ticket sin premio</p>
                <p className="text-slate-500 text-[10px]">Este ticket está activo pero no tiene premios registrados.</p>
            </div>
        </div>
    );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────
export const PayTicketModal = ({ isOpen, onClose }: PayTicketModalProps) => {
    const [serialInput, setSerialInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [paying, setPaying] = useState(false);
    const [ticket, setTicket] = useState<any | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [montoPagado, setMontoPagado] = useState<number | null>(null);

    const handleSearch = async () => {
        if (!serialInput.trim()) return;
        setLoading(true);
        setError('');
        setTicket(null);
        setSuccess(false);

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
                setError(dbError.code === 'PGRST116' ? 'Ticket no encontrado.' : 'Error al buscar el ticket.');
                return;
            }

            // Calcular premio total (suma de premios de los detalles si están registrados)
            const premioTotal = (data.items || []).reduce((sum: number, i: any) => {
                return sum + (i.estado === 'GANADOR' || data.estado === 'GANADOR' || data.estado === 'PAGADO'
                    ? Number(i.premio_estimado || 0)
                    : 0);
            }, 0);

            setTicket({ ...data, total: data.monto_total, premio_total: premioTotal });
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!ticket || ticket.estado !== 'GANADOR') return;
        setPaying(true);
        setError('');
        try {
            // Obtener ID de taquilla del perfil autenticado
            const { data: { user } } = await supabase.auth.getUser();
            let taquillaId = 'bbbbbbbb-0000-0000-0000-000000000001'; // fallback demo
            if (user) {
                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('taquilla_id')
                    .eq('id', user.id)
                    .maybeSingle();
                if (perfil?.taquilla_id) taquillaId = perfil.taquilla_id;
            }

            // Llamar al RPC — la BD valida la propiedad del ticket y registra el pago
            const { data: rpcData, error: rpcError } = await supabase.rpc('pagar_premio', {
                p_taquilla_id: taquillaId,
                p_serial_secreto: serialInput.trim().toUpperCase(),
            });

            if (rpcError) throw new Error(rpcError.message);
            if (rpcData?.status !== 'OK') throw new Error(rpcData?.message || 'Error desconocido al pagar.');

            console.log('✅ Premio pagado por RPC:', rpcData);
            setMontoPagado(Number(rpcData.monto_pagado ?? ticket.premio_total ?? 0));
            setSuccess(true);
            setTimeout(() => { setSuccess(false); handleClose(); }, 3000);
        } catch (err: any) {
            setError(`Error al registrar pago: ${err.message}`);
        } finally {
            setPaying(false);
        }
    };

    const handleClose = () => {
        setSerialInput('');
        setTicket(null);
        setError('');
        setSuccess(false);
        setMontoPagado(null);
        onClose();
    };

    const bs = (n: number) =>
        'Bs. ' + new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

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
                        className="relative w-full max-w-sm bg-slate-900 border border-yellow-900/30 rounded-2xl shadow-2xl shadow-yellow-950/30 overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Glow top */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />

                        {/* Header */}
                        <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center bg-yellow-950/20">
                            <h3 className="text-yellow-400 font-bold text-base flex items-center gap-2">
                                <DollarSign size={18} /> Pagar Premio
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
                                                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 transition-colors font-mono text-sm tracking-widest uppercase"
                                            />
                                            <button
                                                onClick={handleSearch}
                                                disabled={loading || !serialInput.trim()}
                                                className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center min-w-[52px]"
                                            >
                                                {loading ? <Loader2 size={18} className="animate-spin text-black" /> : <Search size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-1.5">
                                            El serial está impreso en el ticket físico del cliente
                                        </p>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                                            <AlertTriangle size={14} className="shrink-0" /> {error}
                                        </div>
                                    )}

                                    {/* Ticket encontrado */}
                                    {ticket && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            {/* Vista digital del ticket */}
                                            <DigitalTicket ticket={ticket} />

                                            {/* Banner de estado */}
                                            <StatusBanner estado={ticket.estado || 'ACTIVO'} />

                                            {/* Botón pagar (solo si es GANADOR) */}
                                            {ticket.estado === 'GANADOR' && (
                                                <button
                                                    onClick={handlePay}
                                                    disabled={paying}
                                                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black rounded-xl shadow-lg shadow-yellow-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 text-sm tracking-wide"
                                                >
                                                    {paying
                                                        ? <><Loader2 size={18} className="animate-spin" /> Procesando pago...</>
                                                        : <>
                                                            <DollarSign size={18} />
                                                            PAGAR PREMIO
                                                            {ticket.premio_total > 0 &&
                                                                <span className="ml-1 font-black">{bs(ticket.premio_total)}</span>
                                                            }
                                                        </>
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
                                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mb-4">
                                        <CheckCircle size={40} className="text-yellow-400" />
                                    </div>
                                    <h3 className="text-white font-black text-xl mb-1">¡Premio Pagado!</h3>
                                    <p className="text-slate-400 text-sm">El pago fue registrado exitosamente.</p>
                                    {montoPagado !== null && montoPagado > 0 && (
                                        <div className="mt-3 px-5 py-2.5 rounded-xl bg-yellow-900/20 border border-yellow-500/30">
                                            <p className="text-[10px] text-yellow-500 uppercase tracking-widest mb-0.5">Monto entregado</p>
                                            <p className="text-yellow-300 font-black text-2xl">{bs(montoPagado)}</p>
                                        </div>
                                    )}
                                    <p className="text-slate-600 text-xs mt-3">El ticket quedó marcado como PAGADO.</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
