'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthError() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      console.error('[AUTH] Authentication error detected:', event.detail);
      
      // Limpiar cualquier estado local
      if (typeof window !== 'undefined') {
        localStorage.removeItem('logto:user');
        sessionStorage.clear();
      }
      
      // Redirigir a la página de error de autenticación
      router.push('/auth-error');
    };

    // Escuchar eventos de error de autenticación
    window.addEventListener('auth-error' as any, handleAuthError);

    return () => {
      window.removeEventListener('auth-error' as any, handleAuthError);
    };
  }, [router]);

  const triggerAuthError = (error: string) => {
    const event = new CustomEvent('auth-error', { detail: error });
    window.dispatchEvent(event);
  };

  return { triggerAuthError };
}