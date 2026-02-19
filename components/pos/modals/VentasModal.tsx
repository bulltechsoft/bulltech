'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, TrendingUp, Ticket, Award, Calendar, Minus, Equal, Trophy, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Periodo = 'hoy' | 'semana' | 'mes' | 'rango';

interface Resumen {
    total_ventas: number;
    tickets_validos: number;
    total_premios: number;
    tickets_premiados: number;
    tickets_no_pagados: number;
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
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function endOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); }
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function getDateRange(
    periodo: Periodo,
    rangeStart: Date | null,
    rangeEnd: Date | null
): { desde: string; hasta: string } {
    const now = new Date();
    if (periodo === 'hoy') {
        return { desde: startOfDay(now).toISOString(), hasta: endOfDay(now).toISOString() };
    }
    if (periodo === 'semana') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return {
            desde: new Date(now.getFullYear(), now.getMonth(), diff).toISOString(),
            hasta: endOfDay(now).toISOString()
        };
    }
    if (periodo === 'mes') {
        return {
            desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
            hasta: endOfDay(now).toISOString()
        };
    }
    // 'rango'
    const start = rangeStart ?? now;
    const end = rangeEnd ?? rangeStart ?? now;
    const [from, to] = start <= end ? [start, end] : [end, start];
    return { desde: startOfDay(from).toISOString(), hasta: endOfDay(to).toISOString() };
}

function fmtDate(d: Date) {
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── MiniCalendar with Range Selection ───────────────────────────────────────

interface MiniCalendarProps {
    rangeStart: Date | null;
    rangeEnd: Date | null;
    onSelect: (date: Date) => void;   // handles both first & second click
    onClear: () => void;
}

function MiniCalendar({ rangeStart, rangeEnd, onSelect, onClear }: MiniCalendarProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(rangeStart ?? today);
    const [hovered, setHovered] = useState<Date | null>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayRaw = new Date(year, month, 1).getDay();
    const offset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(offset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const getDayDate = (d: number) => new Date(year, month, d);

    // Range display helpers
    const effectiveEnd = rangeStart && !rangeEnd && hovered ? hovered : rangeEnd;
    const [rangeFrom, rangeTo] = (() => {
        if (!rangeStart) return [null, null];
        if (!effectiveEnd) return [rangeStart, rangeStart];
        return rangeStart <= effectiveEnd
            ? [rangeStart, effectiveEnd]
            : [effectiveEnd, rangeStart];
    })();

    const isStart = (d: number) => rangeStart && isSameDay(getDayDate(d), rangeStart);
    const isEnd = (d: number) => effectiveEnd && isSameDay(getDayDate(d), effectiveEnd);
    const isInRange = (d: number) => {
        if (!rangeFrom || !rangeTo) return false;
        const date = getDayDate(d);
        return date > rangeFrom && date < rangeTo;
    };
    const isToday = (d: number) => isSameDay(getDayDate(d), today);
    const isFuture = (d: number) => getDayDate(d) > today;

    const selecting = rangeStart && !rangeEnd; // waiting for 2nd click

    return (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {/* Instrucción contextual */}
            <div className="px-4 pt-3 pb-1">
                <p className="text-[9px] text-center font-semibold uppercase tracking-widest text-slate-500">
                    {!rangeStart
                        ? '🗓 Haz clic en la fecha de inicio'
                        : !rangeEnd
                            ? '🗓 Ahora elige la fecha final'
                            : `📅 ${fmtDate(rangeFrom!)}  →  ${fmtDate(rangeTo!)}`
                    }
                </p>
            </div>

            {/* Header mes/año */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">
                    {MESES[month]} <span className="text-purple-400">{year}</span>
                </span>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Días de semana */}
            <div className="grid grid-cols-7 px-3 pt-1 pb-0.5">
                {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-[9px] font-bold text-slate-600 uppercase">{d}</div>
                ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
                {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} className="h-8" />;
                    const start = isStart(day);
                    const end = isEnd(day);
                    const inRng = isInRange(day);
                    const tod = isToday(day);
                    const future = isFuture(day);

                    return (
                        <button
                            key={day}
                            disabled={future}
                            onClick={() => onSelect(getDayDate(day))}
                            onMouseEnter={() => selecting && setHovered(getDayDate(day))}
                            onMouseLeave={() => setHovered(null)}
                            className={`
                                h-8 w-full text-xs font-semibold transition-all relative
                                ${future ? 'opacity-20 cursor-not-allowed text-slate-500' : 'cursor-pointer'}
                                ${(start || end)
                                    ? 'bg-purple-600 text-white z-10 rounded-lg shadow-lg shadow-purple-900/50'
                                    : inRng
                                        ? 'bg-purple-600/20 text-purple-200'
                                        : tod
                                            ? 'text-white border border-purple-500/40 rounded-lg'
                                            : 'text-slate-300 hover:bg-white/10 hover:text-white rounded-lg'
                                }
                                ${start && effectiveEnd && !isSameDay(getDayDate(day), effectiveEnd ?? getDayDate(day))
                                    ? 'rounded-l-lg rounded-r-none'
                                    : ''}
                                ${end && rangeStart && !isSameDay(getDayDate(day), rangeStart)
                                    ? 'rounded-r-lg rounded-l-none'
                                    : ''}
                                ${inRng ? 'rounded-none' : ''}
                            `}
                        >
                            {day}
                            {(start || end) && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer del calendario */}
            <div className="px-3 pb-3 flex gap-2">
                <button onClick={() => { onSelect(today); }}
                    className="flex-1 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all">
                    Hoy
                </button>
                <button onClick={onClear}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-white/5 text-slate-400 hover:text-white text-xs font-bold transition-all">
                    Limpiar
                </button>
            </div>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function VentasModal({ isOpen, onClose }: VentasModalProps) {
    const [periodo, setPeriodo] = useState<Periodo>('hoy');
    const [rangeStart, setRangeStart] = useState<Date | null>(null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taquillaId, setTaquillaId] = useState<string | null>(null);
    const [taquillaNombre, setTaquillaNombre] = useState<string>('');
    const calendarRef = useRef<HTMLDivElement>(null);

    // Cerrar calendario al clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node))
                setShowCalendar(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Obtener taquilla del usuario
    useEffect(() => {
        if (!isOpen) return;
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
                setTaquillaNombre((perfil.taquillas as any)?.nombre || 'Mi Taquilla');
            } else {
                setTaquillaId('bbbbbbbb-0000-0000-0000-000000000001');
                setTaquillaNombre('Taquilla 01 - Demo');
            }
        };
        fetchTaquilla();
    }, [isOpen]);

    const fetchVentas = useCallback(async () => {
        if (!taquillaId) return;
        // Para rango: necesitamos los dos extremos
        if (periodo === 'rango' && !rangeStart) return;

        setLoading(true);
        setError(null);
        try {
            const { desde, hasta } = getDateRange(periodo, rangeStart, rangeEnd);
            const { data, error: dbError } = await supabase
                .from('tickets')
                .select('id, monto_total, estado, detalle_tickets ( premio_estimado )')
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
                return s + ((t.detalle_tickets as any[]) || [])
                    .reduce((sd, d) => sd + Number(d.premio_estimado || 0), 0);
            }, 0);
            const comision = total_ventas * COMISION_PORCENTAJE;
            const neto_entregar = total_ventas - total_premios - comision;

            setResumen({
                total_ventas, tickets_validos: validos.length,
                total_premios, tickets_premiados: premiados.length,
                tickets_no_pagados: ganadores.length,
                comision, neto_entregar,
                tickets_anulados: anulados.length, monto_anulado,
                total_emitidos: all.length,
            });
        } catch (err: any) {
            setError('Error cargando ventas: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [taquillaId, periodo, rangeStart, rangeEnd]);

    useEffect(() => {
        if (isOpen && taquillaId) fetchVentas();
    }, [isOpen, taquillaId, fetchVentas]);

    if (!isOpen) return null;

    // ── Calendar date selection logic (2-click range) ──
    const handleCalendarSelect = (date: Date) => {
        if (!rangeStart || rangeEnd) {
            // Primer clic o reset: inicia nuevo rango
            setRangeStart(date);
            setRangeEnd(null);
            setPeriodo('rango');
        } else {
            // Segundo clic: completa el rango y cierra
            const [from, to] = date >= rangeStart ? [rangeStart, date] : [date, rangeStart];
            setRangeStart(from);
            setRangeEnd(to);
            setPeriodo('rango');
            setShowCalendar(false);
        }
    };

    const handleClearRange = () => {
        setRangeStart(null);
        setRangeEnd(null);
        setPeriodo('hoy');
        setShowCalendar(false);
    };

    const handleQuickPeriod = (p: Periodo) => {
        setPeriodo(p);
        setRangeStart(null);
        setRangeEnd(null);
        setShowCalendar(false);
    };

    // ── Labels ──
    const periodoLabel = () => {
        if (periodo === 'rango') {
            if (!rangeStart) return 'Rango personalizado';
            if (!rangeEnd) return `Desde ${fmtDate(rangeStart)}`;
            return `${fmtDate(rangeStart)}  →  ${fmtDate(rangeEnd)}`;
        }
        return { hoy: 'Hoy', semana: 'Esta Semana', mes: 'Este Mes' }[periodo] ?? '';
    };

    const bs = (n: number) =>
        'Bs. ' + new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-[640px] flex flex-col bg-slate-950 border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/20">
                            <TrendingUp size={17} className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm tracking-wide">RESUMEN DE VENTAS</h2>
                            <p className="text-slate-400 text-xs mt-0.5">{taquillaNombre}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Ícono calendario — abre picker de rango */}
                        <div className="relative" ref={calendarRef}>
                            <button
                                onClick={() => setShowCalendar(v => !v)}
                                title="Seleccionar rango de fechas"
                                className={`p-1.5 rounded-lg border transition-all ${periodo === 'rango'
                                        ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                                        : 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <Calendar size={14} />
                            </button>

                            {showCalendar && (
                                <MiniCalendar
                                    rangeStart={rangeStart}
                                    rangeEnd={rangeEnd}
                                    onSelect={handleCalendarSelect}
                                    onClear={handleClearRange}
                                />
                            )}
                        </div>

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

                    {/* Aviso si el rango solo tiene inicio */}
                    {!loading && periodo === 'rango' && rangeStart && !rangeEnd && (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs text-center">
                            📅 Selecciona también la fecha final en el calendario para ver el rango completo
                        </div>
                    )}

                    {!loading && !error && resumen && (
                        <>
                            {/* ── 5 tarjetas ── */}
                            <div className="grid grid-cols-6 gap-2">
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

                            {/* ── Desglose contable ── */}
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
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate max-w-[70%]">
                        {periodo === 'rango' && <Calendar size={10} className="text-purple-400 shrink-0" />}
                        <span>Período:</span>
                        <span className="text-slate-300 font-semibold truncate">{periodoLabel()}</span>
                    </p>
                    <button
                        onClick={fetchVentas}
                        disabled={loading}
                        className="shrink-0 px-3 py-1.5 text-[10px] font-bold text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/40 rounded-lg transition-all disabled:opacity-50"
                    >
                        ↻ Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
}
