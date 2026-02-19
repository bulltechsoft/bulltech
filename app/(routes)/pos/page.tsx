import { POSShell } from '@/components/pos/POSShell';
import { LotterySelector } from '@/components/pos/LotterySelector';
import { BettingGrid } from '@/components/pos/BettingGrid';
import { TicketCart } from '@/components/pos/TicketCart';

export default function POSPage() {
    return (
        <POSShell>
            {/* COLUMNA IZQUIERDA (30%) - Grilla de Apuestas */}
            <div className="h-full border-r border-white/10 p-2 bg-slate-900/50 overflow-hidden min-h-0">
                <BettingGrid />
            </div>

            {/* COLUMNA CENTRAL (30%) - Loterías */}
            <div className="h-full relative bg-slate-900/30 p-2 border-r border-white/10 overflow-hidden min-h-0">
                <LotterySelector />
            </div>

            {/* COLUMNA DERECHA (40%) - Ticket y Totales */}
            <div className="h-full p-6 relative z-20 overflow-hidden min-h-0">
                <TicketCart />
            </div>
        </POSShell>
    );
}
