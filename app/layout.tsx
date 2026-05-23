import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getLogtoContext } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { logtoConfig } from './logto';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Fondea - Préstamos personales",
  description: "Solicita tu préstamo personal de manera rápida y segura",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    // El middleware ya maneja el redirect con ?intencion preservado.
    // Este redirect es solo un safety net para cuando la cookie existe
    // pero el token expiró (middleware dejó pasar, pero Logto dice no válido).
    redirect('/api/logto/sign-in');
  }

  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
