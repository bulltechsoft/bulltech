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

            {/* Main Container Centered */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">

                {/* Animated Border Wrapper */}
                <div className="relative w-full h-full max-w-[1920px] rounded-2xl p-[1px] overflow-hidden shadow-2xl shadow-purple-900/20">
                    {/* Rotating Border Gradient REMOVED for performance */}
                    {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_90deg,#a855f7_180deg,#ec4899_270deg,transparent_360deg)] opacity-70 blur-md" /> */}
                    <div className="absolute inset-0 rounded-2xl border border-white/5 shadow-[0_0_40px_rgba(168,85,247,0.1)]" />

                    {/* Glass Card Content with Grid */}
                    <div className="relative w-full h-full bg-slate-900/85 backdrop-blur-2xl rounded-2xl border border-white/5 overflow-hidden grid grid-cols-[18%_22%_60%]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
