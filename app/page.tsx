import { getLogtoContext, signIn } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { Logo } from './components/ui/Logo';
import { Button } from './components/ui/Button';
import { SignInButton } from './components/SignInButton';
import { ArrowRight } from 'lucide-react';
import { logtoConfig } from './logto';

export default async function Home() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  console.log('[HOME] isAuthenticated:', isAuthenticated);

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <SignInButton
            onSignIn={async () => {
              'use server';
              await signIn(logtoConfig);
            }}
          >
            Iniciar sesión
          </SignInButton>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-dark">
              Tu préstamo personal, rápido y seguro
            </h1>
            <p className="text-lg text-fondea-text">
              Solicita hasta S/ 50,000 desde cualquier lugar. Aprobación en
              minutos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              onSignIn={async () => {
                'use server';
                await signIn(logtoConfig);
              }}
            >
              Comenzar ahora
            </SignInButton>
            <Button variant="ghost" size="lg">
              Más información
            </Button>
          </div>

          <div className="pt-8 border-t border-border mt-12">
            <p className="text-sm text-fondea-text">
              Migración exitosa a Next.js + Logto SDK oficial
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-fondea-text">
          © 2024 Fondea. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
