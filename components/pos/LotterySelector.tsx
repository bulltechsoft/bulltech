'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePOSStore } from '@/store/usePOSStore';
import { Loader2 } from 'lucide-react';

interface Sorteo {
    id: string;
    nombre: string;
    hora_sorteo: string;
    activo: boolean;
}

interface Loteria {
    id: string;
    nombre: string;
    slug: string;
    sorteos: Sorteo[];
}

export const LotterySelector = () => {
    const [loterias, setLoterias] = useState<Loteria[]>([]);
    const [loading, setLoading] = useState(true);

    // Store Actions
    const setLoteria = usePOSStore((state) => state.setLoteria);
    const toggleSorteo = usePOSStore((state) => state.toggleSorteo);
    const loteriaSeleccionada = usePOSStore((state) => state.loteriaSeleccionada);
    const sorteosSeleccionados = usePOSStore((state) => state.sorteosSeleccionados);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Leterias + Sorteos (Nested)
            const { data, error } = await supabase
                .from('loterias')
                .select(`
                    id, nombre, slug,
                    sorteos ( id, nombre, hora_sorteo, activo )
                `)
                .eq('activo', true)
                .order('nombre');

            if (error) {
                console.error('Error fetching lotteries:', error);
            }

            if (data) {
                setLoterias(data as any as Loteria[]); // Cast result
                // Auto-select first lottery if none selected
                if (data.length > 0 && !loteriaSeleccionada) {
                    const firstLoteria = data[0];
                    setLoteria({ id: firstLoteria.id, nombre: firstLoteria.nombre, slug: firstLoteria.slug });
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filtro de sorteos de la lotería activa
    const sorteosActivos = loterias.find(l => l.id === loteriaSeleccionada?.id)?.sorteos || [];

    // Sort draws by time (simple visual sort, backend validation is strict)
    const sorteosOrdenados = [...sorteosActivos].sort((a, b) => a.hora_sorteo.localeCompare(b.hora_sorteo));

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-purple-500" /></div>;

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* SECTION: LOTERIAS */}
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-purple-500">
                Loterías
            </h2>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar min-h-[40%]">
                {loterias.map((loteria) => (
                    <div
                        key={loteria.id}
                        onClick={() => setLoteria({ id: loteria.id, nombre: loteria.nombre, slug: loteria.slug })}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group
                        ${loteriaSeleccionada?.id === loteria.id
                                ? 'bg-purple-900/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }
                    `}
                    >
                        <span className={`font-semibold transition-colors ${loteriaSeleccionada?.id === loteria.id ? 'text-white' : 'text-slate-300'}`}>
                            {loteria.nombre}
                        </span>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_10px] transition-all
                        ${loteriaSeleccionada?.id === loteria.id ? 'bg-purple-400 shadow-purple-500' : 'bg-slate-600 shadow-transparent'}
                    `} />
                    </div>
                ))}
            </div>

            {/* SECTION: SORTEOS */}
            <div className="pt-4 border-t border-white/10 flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs text-slate-500 uppercase font-bold tracking-wider">Sorteos (Hoy)</h3>
                    {sorteosSeleccionados.length > 0 && (
                        <span className="text-[10px] text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {sorteosSeleccionados.length} Seleccionados
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar cursor-pointer space-y-2">
                    {sorteosOrdenados.map(sorteo => {
                        const isSelected = sorteosSeleccionados.some(s => s.id === sorteo.id);
                        return (
                            <div
                                key={sorteo.id}
                                onClick={() => toggleSorteo(sorteo)}
                                className={`px-3 py-2 rounded flex justify-between items-center border text-sm transition-all
                                ${isSelected
                                        ? 'bg-pink-900/40 border-pink-500/60 text-pink-200 shadow-sm'
                                        : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }
                            `}
                            >
                                <span>{sorteo.nombre}</span>
                                <span className="font-mono text-xs opacity-70">{sorteo.hora_sorteo.slice(0, 5)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
