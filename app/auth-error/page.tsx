'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthErrorPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/api/logto/sign-in');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRetry = () => {
    router.push('/api/logto/sign-in');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
            <svg
              className="h-6 w-6 text-error-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-lg font-medium text-foreground mb-2">
          Sesión Expirada
        </h1>
        
        <p className="text-sm text-muted-foreground mb-6">
          Tu sesión ha expirado o es inválida. Serás redirigido al inicio para volver a iniciar sesión.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          >
            Ir al Inicio
          </button>
          
          <p className="text-xs text-muted-foreground">
            Redirigiendo automáticamente en 3 segundos...
          </p>
        </div>
      </div>
    </div>
  );
}