'use client';

import { useState, useRef } from 'react';
import { usePOSStore } from '@/store/usePOSStore';
import { motion, AnimatePresence } from 'framer-motion';

// Mock de Animalitos (En producción esto vendría de `elementos_loteria` DB o un JSON estático si es estándar)
// Por ahora usaremos generados para coincidir con la grilla 1-36
// Datos fijos de Animalitos (Código, Nombre, Color)
const ANIMALITOS_DATA = [
    { codigo: '0', nombre: 'DELFÍN', color: 'bg-green-700' },
    { codigo: '00', nombre: 'BALLENA', color: 'bg-green-700' },
    { codigo: '1', nombre: 'CARNERO', color: 'bg-red-700' },
    { codigo: '2', nombre: 'TORO', color: 'bg-slate-900' },
    { codigo: '3', nombre: 'CIEMPIÉS', color: 'bg-red-700' },
    { codigo: '4', nombre: 'ALACRÁN', color: 'bg-slate-900' },
    { codigo: '5', nombre: 'LEÓN', color: 'bg-red-700' },
    { codigo: '6', nombre: 'RANA', color: 'bg-slate-900' },
    { codigo: '7', nombre: 'PERICO', color: 'bg-red-700' },
    { codigo: '8', nombre: 'RATÓN', color: 'bg-slate-900' },
    { codigo: '9', nombre: 'ÁGUILA', color: 'bg-red-700' },
    { codigo: '10', nombre: 'TIGRE', color: 'bg-slate-900' },
    { codigo: '11', nombre: 'GATO', color: 'bg-red-700' },
    { codigo: '12', nombre: 'CABALLO', color: 'bg-slate-900' },
    { codigo: '13', nombre: 'MONO', color: 'bg-red-700' },
    { codigo: '14', nombre: 'PALOMA', color: 'bg-slate-900' },
    { codigo: '15', nombre: 'ZORRO', color: 'bg-red-700' },
    { codigo: '16', nombre: 'OSO', color: 'bg-slate-900' },
    { codigo: '17', nombre: 'PAVO', color: 'bg-red-700' },
    { codigo: '18', nombre: 'BURRO', color: 'bg-slate-900' },
    { codigo: '19', nombre: 'CHIVO', color: 'bg-red-700' },
    { codigo: '20', nombre: 'COCHINO', color: 'bg-slate-900' },
    { codigo: '21', nombre: 'GALLO', color: 'bg-red-700' },
    { codigo: '22', nombre: 'CAMELLO', color: 'bg-slate-900' },
    { codigo: '23', nombre: 'CEBRA', color: 'bg-red-700' },
    { codigo: '24', nombre: 'IGUANA', color: 'bg-slate-900' },
    { codigo: '25', nombre: 'GALLINA', color: 'bg-red-700' },
    { codigo: '26', nombre: 'VACA', color: 'bg-slate-900' },
    { codigo: '27', nombre: 'PERRO', color: 'bg-red-700' },
    { codigo: '28', nombre: 'ZAMURO', color: 'bg-slate-900' },
    { codigo: '29', nombre: 'ELEFANTE', color: 'bg-red-700' },
    { codigo: '30', nombre: 'CAIMÁN', color: 'bg-slate-900' },
    { codigo: '31', nombre: 'LAPA', color: 'bg-red-700' },
    { codigo: '32', nombre: 'ARDILLA', color: 'bg-slate-900' },
    { codigo: '33', nombre: 'PESCADO', color: 'bg-red-700' },
    { codigo: '34', nombre: 'VENADO', color: 'bg-slate-900' },
    { codigo: '35', nombre: 'JIRAFA', color: 'bg-red-700' },
    { codigo: '36', nombre: 'CULEBRA', color: 'bg-slate-900' },
];

export const BettingGrid = () => {
    // Store
    const items = usePOSStore(state => state.ticketItems);
    const addToTicket = usePOSStore(state => state.addToTicket);
    const loteriaSeleccionada = usePOSStore(state => state.loteriaSeleccionada);
    const sorteosSeleccionados = usePOSStore(state => state.sorteosSeleccionados);

    // Hooks definidos correctamente
    const [montoInput, setMontoInput] = useState<string>('');
    const [numeroInput, setNumeroInput] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null); // Ref para Monto
    const numeroRef = useRef<HTMLInputElement>(null); // Ref para Número

    // Handler
    const handleCellClick = (numero: string) => {
        if (!loteriaSeleccionada) {
            alert("Selecciona una Lotería primero");
            return;
        }

        if (sorteosSeleccionados.length === 0) {
            alert("Selecciona al menos un Sorteo");
            return;
        }

        const monto = parseFloat(montoInput);
        if (!monto || monto <= 0) {
            alert("⚠️ Ingresa un Monto Válido para apostar");
            inputRef.current?.focus();
            return;
        }

        const animal = ANIMALITOS_DATA.find(a => a.codigo === numero);
        let agregados = 0;

        // Iterate over ALL selected draws
        sorteosSeleccionados.forEach(sorteo => {
            // Check for duplicates
            const yaExiste = items.some(item =>
                item.elemento_codigo === numero &&
                item.sorteo_id === sorteo.id &&
                item.loteria_id === loteriaSeleccionada.id
            );

            if (!yaExiste) {
                addToTicket({
                    loteria_id: loteriaSeleccionada.id,
                    loteria_nombre: loteriaSeleccionada.nombre,
                    sorteo_id: sorteo.id,
                    sorteo_nombre: sorteo.nombre,
                    hora_sorteo: sorteo.hora_sorteo,
                    elemento_codigo: numero,
                    elemento_nombre: animal ? animal.nombre : `Animal ${numero}`,
                    monto: monto,
                    premio_estimado: monto * 30
                });
                agregados++;
            }
        });

        if (agregados === 0) {
            // Feedback subtil (opcional) o sonido de error
            console.log("Ya agregado para todos los sorteos seleccionados");
        }
    };

    // Rapid Entry Logic
    const handleNumberEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const num = numeroInput.trim();
            // Validate if number exists
            const exists = ANIMALITOS_DATA.some(a => a.codigo === num);
            if (exists) {
                inputRef.current?.focus();
                inputRef.current?.select();
            } else {
                alert("Número inválido");
                setNumeroInput('');
            }
        }
    };

    const handleAmountEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!numeroInput) return; // Guard

            handleCellClick(numeroInput);

            // Clear Number, Keep Amount, Focus Number
            setNumeroInput('');
            numeroRef.current?.focus();
        }
    };


    // Check if number is selected in current filter (si está en AL MENOS UNO de los sorteos seleccionados)
    const isSelected = (num: string) => {
        if (!sorteosSeleccionados.length) return false;
        return sorteosSeleccionados.every(s =>
            items.some(i => i.elemento_codigo === num && i.sorteo_id === s.id)
        );
        // Nota: Cambié a EVERY para que se pinte solo si está en TODOS los seleccionados? 
        // O SOME si está en alguno? El usuario dijo "si marco el delfin... se sigue añadiendo".
        // Visualmente, debería marcarse si ya está "completo" para la selección actual.
        // Usemos SOME para feedback inmediato de "ya apostaste a este".
        // return items.some(i => i.elemento_codigo === num && sorteosSeleccionados.some(s => s.id === i.sorteo_id));
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/30 rounded-lg overflow-hidden border-r border-white/5">

            {/* Inputs Rápidos (Número y Monto) */}
            <div className="p-2 border-b border-white/5 space-y-2">

                {/* Input NÚMERO */}
                <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded border border-red-900/30 h-8">
                    <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider w-12">NÚMERO</span>
                    <input
                        ref={numeroRef}
                        type="text"
                        value={numeroInput}
                        onChange={(e) => setNumeroInput(e.target.value)}
                        onKeyDown={handleNumberEnter}
                        placeholder="00"
                        className="w-full bg-transparent border-none text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-0 text-right pr-1 h-full custom-number-input"
                    />
                </div>

                {/* Input MONTO */}
                <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded border border-purple-900/30 h-8">
                    <span className="text-purple-500 text-[10px] font-bold uppercase tracking-wider w-12">MONTO</span>
                    <div className="relative flex-1">
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">$</span>
                        <input
                            ref={inputRef}
                            type="number"
                            value={montoInput}
                            onChange={(e) => setMontoInput(e.target.value)}
                            onKeyDown={handleAmountEnter}
                            placeholder="0.00"
                            className="w-full bg-transparent border-none text-sm font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-0 text-right pr-1 h-full custom-number-input"
                        />
                    </div>
                </div>
            </div>

            {/* Header 0 / 00 - Fijo Arriba (50% Ancho cada uno) */}
            <div className="p-1 pb-0 flex gap-1">
                <div className="flex-1">
                    <Cell
                        data={ANIMALITOS_DATA[0]}
                        selected={isSelected('0')}
                        onClick={() => handleCellClick('0')}
                    />
                </div>
                <div className="flex-1">
                    <Cell
                        data={ANIMALITOS_DATA[1]}
                        selected={isSelected('00')}
                        onClick={() => handleCellClick('00')}
                    />
                </div>
            </div>

            {/* Scrollable Area (Grid 1-36) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                <div className="grid grid-cols-4 gap-1">
                    {ANIMALITOS_DATA.slice(2).map((animal) => (
                        <Cell
                            key={animal.codigo}
                            data={animal}
                            selected={isSelected(animal.codigo)}
                            onClick={() => handleCellClick(animal.codigo)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Componente Celda (Compacta, Color, Nombre, Redondeada)
const Cell = ({ data, selected, onClick }: { data: { codigo: string, nombre: string, color: string }, selected: boolean, onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className={`
                relative w-full h-12 flex flex-col items-center justify-center overflow-hidden rounded-md border transition-all duration-75 group shadow-sm
                ${selected
                    ? 'border-yellow-400 z-10 ring-1 ring-yellow-400 scale-[0.98] brightness-125'
                    : 'border-transparent hover:border-white/20 hover:brightness-110'
                }
                ${data.color}
            `}
        >
            <div className="flex flex-col items-center leading-none">
                <span className="text-3xl font-black text-white drop-shadow-md tracking-tighter">{data.codigo}</span>
                <span className="text-[7px] font-bold text-white/90 uppercase tracking-tighter mt-0.5">{data.nombre}</span>
            </div>
        </button>
    );
};
