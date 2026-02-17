'use client';

import React from 'react';
import { usePOSStore } from '@/store/usePOSStore';

export const TicketReceipt = () => {
    const ticket = usePOSStore(state => state.lastProcessedTicket);
    const moneda = usePOSStore(state => state.monedaOperacion);

    if (!ticket) return null;

    const items = ticket.items;
    const total = ticket.total;

    // Agrupar items POR LOTERIA
    const groupedItems = items.reduce((acc, item) => {
        const key = item.loteria_nombre;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Formatear Fecha Venta real
    const fecha = new Date(ticket.fecha_venta).toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Helper formato hora compacta (12pm, 10am)
    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        // Asume timeStr es "HH:MM:SS" o "HH:MM"
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'pm' : 'am';
        const h12 = h % 12 || 12;
        return `${h12}${ampm}`;
    };

    return (
        <div className="hidden print:block print:w-full print:max-w-[58mm] print:font-mono print:text-black print:text-[12px] print:leading-tight">
            {/* Margenes manejados por @page en CSS global */}
            <div className="px-1 pt-2 pb-8">

                {/* Header */}
                <div className="text-center mb-2">
                    <h1 className="text-sm font-black uppercase tracking-wider">AGENCIA: AGENCIA DEMO</h1>
                    <p className="font-bold text-[10px] mt-0.5">Taquilla: 01</p>
                    <p className="font-bold text-[10px] uppercase">{fecha}</p>

                    <div className="flex justify-between px-1 mt-2 text-[11px] font-black uppercase">
                        <span>N/T:{ticket.numero_ticket}</span>
                    </div>
                    <div className="text-center text-[11px] font-black uppercase">
                        <span>S/N:{ticket.serial}</span>
                    </div>
                </div>

                <div className="border-b-2 border-dashed border-black mb-1" />

                {/* Column Headers */}
                <div className="flex justify-between text-[10px] font-bold border-b border-black mb-1 pb-1 uppercase">
                    <span className="w-[45%] text-left">DESCRIPCION</span>
                    <span className="w-[20%] text-center">HORA</span>
                    <span className="w-[30%] text-right">MONTO</span>
                </div>

                {/* Grouped Bets */}
                {Object.entries(groupedItems).map(([loteriaNombre, groupItems]) => (
                    <div key={loteriaNombre} className="mb-2">
                        {/* Header Group: Lotería */}
                        <div className="mb-0.5">
                            <p className="font-black uppercase text-xs border-b border-black/50 inline-block">
                                {loteriaNombre}
                            </p>
                        </div>

                        {/* Items */}
                        <div className="flex flex-col gap-0.5">
                            {groupItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-center font-bold text-[11px]">
                                    {/* Col 1: Animal (Cortado inteligente) */}
                                    <span className="w-[45%] whitespace-nowrap overflow-hidden text-left uppercase">
                                        {item.elemento_codigo.padStart(2, '0')}-{item.elemento_nombre.substring(0, 8)}
                                    </span>
                                    {/* Col 2: Hora (10am) */}
                                    <span className="w-[20%] text-center text-[10px] uppercase">
                                        {formatTime(item.hora_sorteo)}
                                    </span>
                                    {/* Col 3: Monto (Sin decimales) */}
                                    <span className="w-[30%] text-right">
                                        {Math.floor(item.monto)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="border-t-2 border-dashed border-black mt-2 mb-2" />

                {/* Footer Totals */}
                <div className="flex justify-between items-end font-black text-lg mb-6 uppercase">
                    <span>TOTAL {moneda}:</span>
                    <span>{Math.floor(total)}</span>
                </div>

                {/* Legal / Footer Minimalista */}
                <div className="text-center text-[11px] font-black pb-4 uppercase">
                    <p className="mb-1">** CADUCA A LOS 3 DIAS **</p>
                    <p>** SUERTE **</p>
                </div>
            </div>
        </div>
    );
};
