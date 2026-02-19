import { POSShell } from '@/components/pos/POSShell';
import { LotterySelector } from '@/components/pos/LotterySelector';
import { BettingGrid } from '@/components/pos/BettingGrid';
import { TicketCart } from '@/components/pos/TicketCart';

export default function POSPage() {
    return (
        <POSShell>
            {/* COLUMNA IZQUIERDA (30%) - Grilla de Apuestas */}
            <div className="h-full border-r border-white/10 p-2 bg-slate-900/50">
                <BettingGrid />
            </div>

            {/* COLUMNA CENTRAL (30%) - Loterías */}
            <div className="h-full relative bg-slate-900/30 p-2 border-r border-white/10">
                <LotterySelector />
            </div>

            {/* COLUMNA DERECHA (40%) - Ticket y Totales */}
            <div className="h-full p-6 flex flex-col justify-center relative z-20">
                <TicketCart />
            </div>
        </POSShell>
    );
}
