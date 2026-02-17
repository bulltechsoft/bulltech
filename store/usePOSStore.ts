import { create } from 'zustand';

interface TicketItem {
    id: string; // unique internal id for the item in cart
    loteria_id: string;
    loteria_nombre: string;
    sorteo_id: string;
    sorteo_nombre: string;
    hora_sorteo: string; // "10:00:00"
    elemento_codigo: string; // "1", "36", "0"
    elemento_nombre: string; // "Delfín"
    monto: number;
    premio_estimado: number;
}

interface POSState {
    // Configuración de Venta
    monedaOperacion: 'VES' | 'USD';

    // Selección Actual
    // Selección Actual
    loteriaSeleccionada: { id: string; nombre: string; slug: string } | null;
    sorteosSeleccionados: { id: string; nombre: string; hora_sorteo: string }[];

    // Carrito
    ticketItems: TicketItem[];
    montoGlobalInput: number; // Para entrada rápida (ej. escribe 50 y clica varios)

    // Acciones
    setLoteria: (loteria: POSState['loteriaSeleccionada']) => void;
    toggleSorteo: (sorteo: { id: string; nombre: string; hora_sorteo: string }) => void;
    addToTicket: (item: Omit<TicketItem, 'id'>) => void;
    removeFromTicket: (itemId: string) => void;
    clearTicket: () => void;
    setMontoGlobal: (monto: number) => void;

    // Getters (Computados)
    totalVenta: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
    monedaOperacion: 'VES', // Default, debería venir de la Taquilla config

    loteriaSeleccionada: null,
    sorteosSeleccionados: [],

    ticketItems: [],
    montoGlobalInput: 0,

    setLoteria: (loteria) => set({ loteriaSeleccionada: loteria, sorteosSeleccionados: [] }), // Reset sorteos al cambiar loteria

    toggleSorteo: (sorteo) => set((state) => {
        const exists = state.sorteosSeleccionados.find(s => s.id === sorteo.id);
        if (exists) {
            return { sorteosSeleccionados: state.sorteosSeleccionados.filter(s => s.id !== sorteo.id) };
        } else {
            return { sorteosSeleccionados: [...state.sorteosSeleccionados, sorteo] };
        }
    }),

    setMontoGlobal: (monto) => set({ montoGlobalInput: monto }),

    addToTicket: (item) => set((state) => ({
        ticketItems: [
            ...state.ticketItems,
            { ...item, id: Math.random().toString(36).substring(7) }
        ]
    })),

    removeFromTicket: (itemId) => set((state) => ({
        ticketItems: state.ticketItems.filter((i) => i.id !== itemId)
    })),

    clearTicket: () => set({ ticketItems: [] }),

    totalVenta: () => {
        const { ticketItems } = get();
        return ticketItems.reduce((sum, item) => sum + item.monto, 0);
    }
}));
