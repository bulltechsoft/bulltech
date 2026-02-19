'use client';

import React from 'react';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export const POSShell = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[url('/assets/background-galaxy.webp')] bg-cover bg-center font-sans tracking-wide">
            {/* Overlay Oscuro */}
            <div className="absolute inset-0 bg-slate-950/70" />

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
                    <div className="relative w-full h-full bg-slate-950/90 backdrop-blur-3xl rounded-3xl border border-white/5 overflow-hidden grid grid-cols-[30%_30%_40%]">
                        {children}
                    </div>
                </div>

                {/* FOOTER PLACEHOLDER (Visual Guide) */}
                {/* <div className="absolute bottom-0 left-0 w-full h-20 bg-blue-900/30 flex items-center justify-center text-white font-bold">FOOTER BUTTONS</div> */}
            </div>
        </div>
    );
};
