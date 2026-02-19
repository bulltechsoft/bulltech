'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, TrendingUp, Ticket, Award, Calendar, Minus, Equal, Trophy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type Periodo = 'hoy' | 'semana' | 'mes' | 'fecha';

interface Resumen {
    total_ventas: number;
    tickets_validos: number;
    total_premios: number;
    tickets_premiados: number;   // GANADOR + PAGADO
    tickets_no_pagados: number;  // solo GANADOR
    comision: number;
    neto_entregar: number;
    tickets_anulados: number;
    monto_anulado: number;
    total_emitidos: number;
}

interface VentasModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const COMISION_PORCENTAJE = 0.15;
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ─── Date Range Calculator ───────────────────────────────────────────────────

function getDateRange(
    periodo: Periodo,
    customDate: Date | null
): { desde: string; hasta: string } {
    const now = new Date();

    if (periodo === 'hoy') {
        const desde = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        return { desde, hasta: now.toISOString() };
    }
    if (periodo === 'semana') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const desde = new Date(now.getFullYear(), now.getMonth(), diff).toISOString();
        return { desde, hasta: now.toISOString() };
    }
    if (periodo === 'mes') {
        const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        return { desde, hasta: now.toISOString() };
    }
    // 'fecha' — un día específico
    const d = customDate ?? now;
    const desde = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString();
    const hasta = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
    return { desde, hasta };
}

// ─── Mini Calendar Component ─────────────────────────────────────────────────

interface MiniCalendarProps {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

function MiniCalendar({ selectedDate, onSelect, onClose }: MiniCalendarProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(selectedDate ?? today);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Primer día del mes (ajustado a lunes)
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Lu=0 … Do=6
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(offset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Completar hasta múltiplo de 7
    while (cells.length % 7 !== 0) cells.push(null);

    const isSelected = (d: number) =>
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === d;

    const isToday = (d: number) =>
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === d;

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    return (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Glow top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {/* Header mes/año */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70">
                <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={15} />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">
                    {MESES[month]} <span className="text-purple-400">{year}</span>
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronRight size={15} />
                </button>
            </div>

            {/* Días de semana */}
            <div className="grid grid-cols-7 px-3 pt-2 pb-1">
                {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase">
                        {d}
                    </div>
                ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} />;
                    const sel = isSelected(day);
                    const tod = isToday(day);
                    const future = new Date(year, month, day) > today;
                    return (
                        <button
                            key={day}
                            disabled={future}
                            onClick={() => {
                                onSelect(new Date(year, month, day));
                                onClose();
                            }}
                            className={`
                                h-8 w-full rounded-lg text-xs font-semibold transition-all
                                ${future ? 'opacity-20 cursor-not-allowed text-slate-500' : ''}
                                ${sel
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                                    : tod
                                        ? 'bg-white/10 text-white border border-purple-500/40'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Botón "Hoy" */}
            <div className="px-3 pb-3">
                <button
                    onClick={() => { onSelect(today); onClose(); }}
                    className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all"
                >
                    Ir a hoy
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function VentasModal({ isOpen, onClose }: VentasModalProps) {
    const [periodo, setPeriodo] = useState<Periodo>('hoy');
    const [customDate, setCustomDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taquillaId, setTaquillaId] = useState<string | null>(null);
    const [taquillaNombre, setTaquillaNombre] = useState<string>('');
    const calendarRef = useRef<HTMLDivElement>(null);

    // Cerrar calendario al hacer clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Obtener taquilla del usuario actual
    useEffect(() => {
        const fetchTaquilla = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: perfil } = await supabase
                .from('perfiles')
                .select('taquilla_id, taquillas(nombre)')
                .eq('id', user.id)
                .maybeSingle();

            if (perfil?.taquilla_id) {
                setTaquillaId(perfil.taquilla_id);
                const taq = perfil.taquillas as any;
                setTaquillaNombre(taq?.nombre || 'Mi Taquilla');
            } else {
                setTaquillaId('bbbbbbbb-0000-0000-0000-000000000001');
                setTaquillaNombre('Taquilla 01 - Demo');
            }
        };
        if (isOpen) fetchTaquilla();
    }, [isOpen]);

    const fetchVentas = useCallback(async () => {
        if (!taquillaId) return;
        setLoading(true);
        setError(null);

        try {
            const { desde, hasta } = getDateRange(periodo, customDate);

            const { data, error: dbError } = await supabase
                .from('tickets')
                .select(`
                    id,
                    monto_total,
                    estado,
                    detalle_tickets ( premio_estimado )
                `)
                .eq('taquilla_id', taquillaId)
                .gte('fecha_venta', desde)
                .lte('fecha_venta', hasta);

            if (dbError) throw dbError;

            const all = data || [];
            const validos = all.filter(t => t.estado !== 'ANULADO');
            const anulados = all.filter(t => t.estado === 'ANULADO');
            const ganadores = all.filter(t => t.estado === 'GANADOR');
            const pagados = all.filter(t => t.estado === 'PAGADO');
            const premiados = [...ganadores, ...pagados];

            const total_ventas = validos.reduce((s, t) => s + Number(t.monto_total), 0);
            const monto_anulado = anulados.reduce((s, t) => s + Number(t.monto_total), 0);

            const total_premios = pagados.reduce((s, t) => {
                const detalles = (t.detalle_tickets as any[]) || [];
                return s + detalles.reduce((sd, d) => sd + Number(d.premio_estimado || 0), 0);
            }, 0);

            const comision = total_ventas * COMISION_PORCENTAJE;
            const neto_entregar = total_ventas - total_premios - comision;

            setResumen({
                total_ventas,
                tickets_validos: validos.length,
                total_premios,
                tickets_premiados: premiados.length,
                tickets_no_pagados: ganadores.length,
                comision,
                neto_entregar,
                tickets_anulados: anulados.length,
                monto_anulado,
                total_emitidos: all.length,
            });

        } catch (err: any) {
            setError('Error cargando ventas: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [taquillaId, periodo, customDate]);

    useEffect(() => {
        if (isOpen && taquillaId) fetchVentas();
    }, [isOpen, taquillaId, fetchVentas]);

    if (!isOpen) return null;

    const bs = (n: number) =>
        'Bs. ' + new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);

    const periodoLabel = () => {
        if (periodo === 'fecha' && customDate) {
            return customDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
        }
        return { hoy: 'Hoy', semana: 'Esta Semana', mes: 'Este Mes' }[periodo as string] ?? '';
    };

    const handleSelectDate = (date: Date) => {
        setCustomDate(date);
        setPeriodo('fecha');
    };

    const handleQuickPeriod = (p: Periodo) => {
        setPeriodo(p);
        setCustomDate(null);
        setShowCalendar(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-[640px] flex flex-col bg-slate-950 border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden">

                {/* Glow top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/50">
                    {/* Título */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/20">
                            <TrendingUp size={17} className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm tracking-wide">RESUMEN DE VENTAS</h2>
                            <p className="text-slate-400 text-xs mt-0.5">{taquillaNombre}</p>
                        </div>
                    </div>

                    {/* Controles de filtro */}
                    <div className="flex items-center gap-1.5">
                        {/* Ícono Calendario — abre/cierra picker */}
                        <div className="relative" ref={calendarRef}>
                            <button
                                onClick={() => setShowCalendar(v => !v)}
                                title="Seleccionar fecha específica"
                                className={`p-1.5 rounded-lg border transition-all ${periodo === 'fecha'
                                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <Calendar size={14} />
                            </button>

                            {showCalendar && (
                                <MiniCalendar
                                    selectedDate={customDate}
                                    onSelect={handleSelectDate}
                                    onClose={() => setShowCalendar(false)}
                                />
                            )}
                        </div>

                        {/* Separador */}
                        <div className="w-px h-5 bg-white/10 mx-0.5" />

                        {/* Botones rápidos */}
                        {(['hoy', 'semana', 'mes'] as Periodo[]).map(p => (
                            <button
                                key={p}
                                onClick={() => handleQuickPeriod(p)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${periodo === p
                                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {p === 'hoy' ? 'HOY' : p === 'semana' ? 'SEMANA' : 'MES'}
                            </button>
                        ))}

                        {/* Cerrar modal */}
                        <button
                            onClick={onClose}
                            className="ml-1 p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/30 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-white transition-all"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="p-5 space-y-4">

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-14 gap-3">
                            <div className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                            <p className="text-slate-400 text-xs">Calculando...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}

                    {!loading && !error && resumen && (
                        <>
                            {/* ── 5 Tarjetas: 3 arriba + 2 abajo ── */}
                            <div className="grid grid-cols-6 gap-2">
                                {/* Fila 1 */}
                                <div className="col-span-2 p-3 rounded-xl bg-slate-900/70 border border-white/5 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Ticket size={10} className="text-slate-400" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Emitidos</span>
                                    </div>
                                    <p className="text-xl font-black text-white">{resumen.total_emitidos}</p>
                                </div>

                                <div className="col-span-2 p-3 rounded-xl bg-yellow-900/10 border border-yellow-500/15 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Award size={10} className="text-yellow-400" />
                                        <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest">Válidos</span>
                                    </div>
                                    <p className="text-xl font-black text-white">{resumen.tickets_validos}</p>
                                </div>

                                <div className="col-span-2 p-3 rounded-xl bg-red-900/10 border border-red-500/10 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <X size={10} className="text-red-400" />
                                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Anulados</span>
                                    </div>
                                    <p className="text-xl font-black text-white">{resumen.tickets_anulados}</p>
                                </div>

                                {/* Fila 2 */}
                                <div className="col-span-3 p-3 rounded-xl bg-emerald-900/15 border border-emerald-500/20 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Trophy size={10} className="text-emerald-400" />
                                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Premiados</span>
                                    </div>
                                    <p className="text-xl font-black text-white">{resumen.tickets_premiados}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Ganador + Pagado</p>
                                </div>

                                <div className="col-span-3 p-3 rounded-xl bg-orange-900/15 border border-orange-500/20 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Clock size={10} className="text-orange-400" />
                                        <span className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">No Pagados</span>
                                    </div>
                                    <p className="text-xl font-black text-white">{resumen.tickets_no_pagados}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Pendientes de cobro</p>
                                </div>
                            </div>

                            {/* ── Desglose Contable ── */}
                            <div className="rounded-xl border border-white/8 overflow-hidden">

                                <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/60 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total Ventas</p>
                                            <p className="text-[10px] text-slate-500">{resumen.tickets_validos} ticket{resumen.tickets_validos !== 1 ? 's' : ''} válido{resumen.tickets_validos !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <span className="text-base font-black text-white">{bs(resumen.total_ventas)}</span>
                                </div>

                                <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/40 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Minus size={12} className="text-red-400 ml-[-1px]" />
                                        <div>
                                            <p className="text-xs font-bold text-red-300 uppercase tracking-wider">Premios Pagados</p>
                                            <p className="text-[10px] text-slate-500">{resumen.tickets_premiados} ticket{resumen.tickets_premiados !== 1 ? 's' : ''} ganador{resumen.tickets_premiados !== 1 ? 'es' : ''}</p>
                                        </div>
                                    </div>
                                    <span className="text-base font-black text-red-400">− {bs(resumen.total_premios)}</span>
                                </div>

                                <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/40 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Minus size={12} className="text-emerald-400 ml-[-1px]" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Tu Comisión</p>
                                            <p className="text-[10px] text-slate-500">{COMISION_PORCENTAJE * 100}% sobre ventas</p>
                                        </div>
                                    </div>
                                    <span className="text-base font-black text-emerald-400">− {bs(resumen.comision)}</span>
                                </div>

                                <div className="px-4 py-1.5 bg-slate-800/40 flex items-center gap-2">
                                    <Equal size={12} className="text-slate-500" />
                                    <div className="flex-1 h-px bg-white/5" />
                                </div>

                                <div className={`flex items-center justify-between px-4 py-4 ${resumen.neto_entregar >= 0
                                    ? 'bg-gradient-to-r from-purple-900/30 to-purple-950/30'
                                    : 'bg-gradient-to-r from-red-900/30 to-red-950/30'
                                    }`}>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Neto a Entregar al Banquero</p>
                                        <p className="text-[9px] text-slate-500 mt-0.5">Ventas − Premios − Comisión</p>
                                    </div>
                                    <span className={`text-xl font-black ${resumen.neto_entregar >= 0 ? 'text-purple-300' : 'text-red-400'}`}>
                                        {bs(resumen.neto_entregar)}
                                    </span>
                                </div>
                            </div>

                            {resumen.tickets_anulados > 0 && (
                                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-900/10 border border-red-500/10">
                                    <span className="text-[10px] text-red-400 font-semibold">Monto anulado (no incluido en ventas)</span>
                                    <span className="text-[10px] text-red-400 font-bold">{bs(resumen.monto_anulado)}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-slate-900/30">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        {periodo === 'fecha' && <Calendar size={10} className="text-purple-400" />}
                        Período: <span className="text-slate-300 font-semibold ml-1">{periodoLabel()}</span>
                    </p>
                    <button
                        onClick={fetchVentas}
                        disabled={loading}
                        className="px-3 py-1.5 text-[10px] font-bold text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/40 rounded-lg transition-all disabled:opacity-50"
                    >
                        ↻ Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
}
