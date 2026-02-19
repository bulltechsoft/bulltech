'use client';

import React from 'react';
import { useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { VoidTicketModal } from '@/components/pos/modals/VoidTicketModal';
import { ReprintTicketModal } from '@/components/pos/modals/ReprintTicketModal';
import { VentasModal } from '@/components/pos/modals/VentasModal';
import { PayTicketModal } from '@/components/pos/modals/PayTicketModal';

export const POSShell = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [showReprintModal, setShowReprintModal] = useState(false);
    const [showVentasModal, setShowVentasModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[url('/assets/background-galaxy.webp')] bg-cover bg-center font-sans tracking-wide">
            {/* Overlay Oscuro */}
            <div className="absolute inset-0 bg-slate-950/70" />

            {/* Modals */}
            <VoidTicketModal isOpen={showVoidModal} onClose={() => setShowVoidModal(false)} />
            <ReprintTicketModal isOpen={showReprintModal} onClose={() => setShowReprintModal(false)} />
            <VentasModal isOpen={showVentasModal} onClose={() => setShowVentasModal(false)} />
            <PayTicketModal isOpen={showPayModal} onClose={() => setShowPayModal(false)} />

            {/* Logout Button (Absolute Top Left) */}
            <button
                onClick={handleLogout}
                className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900/80 hover:bg-red-900/50 border border-white/10 hover:border-red-500/50 rounded-lg text-slate-300 hover:text-white transition-all backdrop-blur-md group"
                title="Cerrar Sesión"
            >
                <span className="text-xs font-bold uppercase tracking-wider hidden group-hover:inline-block">Salir</span>
                <LogOut size={18} />
            </button>

            {/* Main Container Centered with Header/Footer Space */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center py-20 px-8">

                {/* HEADER PLACEHOLDER (Visual Guide) */}
                {/* <div className="absolute top-0 left-0 w-full h-20 bg-red-900/30 flex items-center justify-center text-white font-bold">HEADER</div> */}

                {/* Animated Border Wrapper - Reduced Size */}
                <div className="relative w-full max-w-7xl h-full max-h-[800px] rounded-3xl p-[1px] overflow-hidden shadow-2xl shadow-purple-900/40 transform transition-all">

                    <div className="absolute inset-0 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)]" />

                    {/* Glass Card Content with Grid */}
                    <div className="relative w-full h-full bg-slate-950/90 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden flex flex-col">

                        {/* Main Content Area (Grid 3 Cols) */}
                        <div className="flex-1 min-h-0 grid grid-cols-[30%_30%_40%] overflow-hidden">
                            {children}
                        </div>

                        {/* Footer Actions Area (2 Rows x 4 Cols) */}
                        <div className="flex-none h-24 bg-slate-900/50 border-t border-white/10 p-2 z-20">
                            <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-2">
                                {/* Row 1 */}
                                <button
                                    onClick={() => setShowReprintModal(true)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-white/5 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">🖨️</span> REIMPRIMIR
                                </button>
                                <button
                                    onClick={() => setShowVoidModal(true)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-white/5 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">🗑️</span> ANULAR
                                </button>
                                <button
                                    onClick={() => setShowVentasModal(true)}
                                    className="bg-slate-800 hover:bg-emerald-900/40 text-white hover:text-emerald-300 text-xs font-bold rounded-lg border border-white/5 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">📊</span> VENTAS
                                </button>
                                <button
                                    onClick={() => setShowPayModal(true)}
                                    className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 border border-yellow-600/30 hover:border-yellow-500/50 text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">🏆</span> PAGAR
                                </button>

                                {/* Row 2 */}
                                <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-white/5 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">📊</span> REPORTE X
                                </button>
                                <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-white/5 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">📈</span> CIERRE Z
                                </button>
                                <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-white/5 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">🔧</span> CONFIG
                                </button>
                                <button className="bg-red-900/20 hover:bg-red-900/40 text-red-200 border border-red-900/30 hover:border-red-500/30 text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group">
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">🚪</span> SALIR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER PLACEHOLDER (Visual Guide) */}
            {/* <div className="absolute bottom-0 left-0 w-full h-20 bg-blue-900/30 flex items-center justify-center text-white font-bold">FOOTER BUTTONS</div> */}
        </div>
    );
};
