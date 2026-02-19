

import React from 'react';
import { usePOSStore } from '@/store/usePOSStore';

export const TicketReceipt = () => {
    const ticket = usePOSStore(state => state.lastProcessedTicket);
    const moneda = usePOSStore(state => state.monedaOperacion);

    if (!ticket) return null;

    const items = ticket.items || [];
    const total = ticket.total;

    // Agrupar items: LOTERIA -> SORTEO
    const groupedData = items.reduce((acc: any, item: any) => {
        const loteria = item.loteria_nombre || 'Loteria';
        const sorteo = item.sorteo_nombre || 'Sorteo';

        if (!acc[loteria]) {
            acc[loteria] = {};
        }
        if (!acc[loteria][sorteo]) {
            acc[loteria][sorteo] = [];
        }
        acc[loteria][sorteo].push(item);
        return acc;
    }, {});

    // Formatear Fecha Venta
    const fecha = new Date(ticket.fecha_venta).toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    return (
        <div className="hidden print:block print:w-[58mm] print:overflow-hidden print:font-mono print:text-black print:text-[10px] print:leading-tight bg-white text-black p-2">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: 58mm auto; }
                    body { margin: 0; padding: 0; }
                }
            `}</style>

            <div className="flex flex-col items-center mb-2">
                <h2 className="font-bold text-xs uppercase">AGENCIA DEMO</h2>
                <div className="text-[9px]">RIF: J-12345678-0</div>
                <div className="text-[9px] mt-1">{fecha}</div>
                <div className="w-full mt-1 text-[9px] font-bold">
                    <div className="flex justify-between">
                        <span>TICKET: {ticket.ticket_numero}</span>
                        <span>SERIAL: {ticket.serial_secreto}</span>
                    </div>
                </div>
            </div>

            <div className="border-b border-dashed border-black mb-1"></div>

            {/* Iterar Loterias */}
            {Object.keys(groupedData).map((loteria) => (
                <div key={loteria} className="mb-2">
                    <div className="font-bold text-[10px] uppercase mb-0.5 border-b border-black inline-block">
                        {loteria}
                    </div>

                    {/* Iterar Sorteos dentro de Loteria */}
                    {Object.keys(groupedData[loteria]).map((sorteo) => (
                        <div key={sorteo} className="ml-0 mb-1">
                            <div className="text-[9px] font-bold italic mb-0.5 mt-0.5 text-gray-800">
                                -- {sorteo} --
                            </div>

                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 pl-1">
                                {groupedData[loteria][sorteo].map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between w-full text-[10px]">
                                        <span className="font-bold">
                                            {item.elemento_codigo.padStart(2, '0')} - {item.elemento_nombre.substring(0, 10)}
                                        </span>
                                        <span className="font-bold">
                                            {parseFloat(item.monto).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            <div className="border-t border-dashed border-black mt-2 mb-1"></div>

            <div className="flex justify-between text-xs font-bold uppercase mt-1">
                <span>TOTAL {moneda}:</span>
                <span className="text-sm">{Number(total).toFixed(2)}</span>
            </div>

            <div className="mt-4 text-[8px] text-center font-medium uppercase">
                <p>CADUCA A LOS 3 DIAS</p>
                <p>VERIFIQUE SU TICKET</p>
                <p>GRACIAS POR SU PREFERENCIA</p>
            </div>
        </div>
    );
};
