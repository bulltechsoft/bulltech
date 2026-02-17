import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('/assets/background-galaxy.webp')] bg-cover bg-center opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <main className="relative z-10 flex flex-col items-center gap-8 p-4 text-center">
        <h1 className="text-6xl font-black tracking-tighter uppercase drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]">
          Bull<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Tech</span>
        </h1>

        <p className="max-w-md text-slate-400 text-lg">
          Plataforma de Alta Frecuencia para Gestión de Loterías y Apuestas.
        </p>

        <div className="flex gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Iniciar Sesión
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-4 text-slate-600 text-xs uppercase tracking-widest">
        Sistema Privado &bull; V1.0.0
      </footer>
    </div>
  );
}
