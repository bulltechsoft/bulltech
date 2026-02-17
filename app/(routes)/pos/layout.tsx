import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'BullTech POS | Terminal de Venta',
    description: 'Sistema de alta frecuencia para venta de loterías',
};

export default function POSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`h-screen w-screen overflow-hidden bg-black text-white ${inter.className}`}>
            {children}
        </div>
    );
}
