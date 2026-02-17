'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // Cargar usuario guardado
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedUser = localStorage.getItem('bulltech_user');
            if (savedUser) {
                setFormData(prev => ({ ...prev, username: savedUser }));
                setRememberMe(true);
            }
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Guardar o borrar usuario según checkbox
            if (rememberMe) {
                localStorage.setItem('bulltech_user', formData.username);
            } else {
                localStorage.removeItem('bulltech_user');
            }

            // Mapeo de Usuario a Email ficticio para Supabase
            const email = `${formData.username}@bulltech.local`;
            console.log('Intentando login con:', email);

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: formData.password,
            });

            console.log('Respuesta Supabase:', { data, authError });

            if (authError) throw authError;

            // Redirección exitosa
            console.log('Login exitoso, redirigiendo...');
            router.push('/pos');

        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message === 'Invalid login credentials'
                ? 'Credenciales incorrectas'
                : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center bg-[url('/assets/background-galaxy.webp')] bg-cover bg-center overflow-hidden">
            {/* Overlay Oscuro SIN BLUR */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Contenido Principal */}
            <div className="relative z-10 w-full max-w-xl px-4 flex flex-col items-center">

                {/* LOGO (Aumentado ~30%) */}
                <div className="mb-10 flex flex-col items-center">
                    <div className="relative w-64 h-20 mb-2">
                        <Image
                            src="/assets/logo-bulltech-white.webp"
                            alt="BullTech Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                            priority
                        />
                    </div>
                </div>

                {/* Banner de Bienvenida */}
                <div className="mb-6 w-full text-center">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-sm">
                        Accede a tu Taquilla de Ventas | POS
                    </h2>
                </div>

                {/* CARD LOGIN CON BORDE NEON DELGADO */}
                <div className="relative w-full group">

                    {/* Contenedor del Borde Animado */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                    <div className="relative rounded-3xl p-[1px] overflow-hidden">
                        {/* Capa de Rotación */}
                        <div className="absolute inset-[-50%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(transparent_0deg,#a855f7_90deg,#ec4899_180deg,transparent_360deg)] opacity-100" />

                        {/* Background Card */}
                        <div className="relative bg-slate-950 rounded-3xl p-10 h-full w-full border border-white/5 shadow-2xl">

                            <form onSubmit={handleLogin} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-sm uppercase text-slate-400 font-bold tracking-wider ml-1">Usuario</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors">
                                            <User size={24} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value.trim() })}
                                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                            placeholder="Ej. taquilla_01"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm uppercase text-slate-400 font-bold tracking-wider ml-1">Contraseña</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors">
                                            <Lock size={24} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-4 pl-12 pr-12 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-sans"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Checkbox Recordar Usuario */}
                                <div className="flex items-center gap-2 ml-1">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-slate-950/50 transition-all checked:border-purple-500 checked:bg-purple-600 hover:border-purple-400"
                                        />
                                        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <label htmlFor="remember" className="cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                                        Recordar usuario
                                    </label>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-center animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'INGRESAR AL SISTEMA'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    Acceso Restringido - BullTech v1.0
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
