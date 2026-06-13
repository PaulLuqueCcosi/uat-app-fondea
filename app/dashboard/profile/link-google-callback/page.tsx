'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifySocialCallback, completeLinkGoogle } from '@/app/actions/profile.actions';

/**
 * Callback page para vincular Google.
 * Google redirige aquí después de que el usuario autorice.
 * Captura los query params y completa la vinculación.
 *
 * URL: /dashboard/profile/link-google-callback?code=...&state=...
 *
 * Los IDs de verificación se guardan en sessionStorage antes del redirect.
 */

type Status = 'processing' | 'success' | 'error';

export default function LinkGoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    async function processCallback() {
      try {
        // Recuperar IDs guardados antes del redirect
        const socialVerificationId = sessionStorage.getItem('linkGoogle_socialVerificationId');
        const identityVerificationId = sessionStorage.getItem('linkGoogle_identityVerificationId');

        if (!socialVerificationId || !identityVerificationId) {
          setStatus('error');
          setError('Sesión de vinculación expirada. Intenta de nuevo desde tu perfil.');
          return;
        }

        // Construir connectorData con todos los query params del callback + redirectUri
        const connectorData: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          connectorData[key] = value;
        });
        // Logto necesita el redirectUri para intercambiar el code con Google
        connectorData.redirectUri = window.location.origin + window.location.pathname;

        // Paso 1: Verificar con Logto que Google autorizó correctamente
        const verifyResult = await verifySocialCallback(connectorData, socialVerificationId);
        if (!verifyResult.success) {
          setStatus('error');
          setError(verifyResult.error ?? 'Error al verificar con Google');
          return;
        }

        // Paso 2: Completar la vinculación
        const linkResult = await completeLinkGoogle(identityVerificationId, socialVerificationId);
        if (!linkResult.success) {
          setStatus('error');
          setError(linkResult.error || 'No se pudo vincular la cuenta');
          return;
        }

        // Limpiar sessionStorage
        sessionStorage.removeItem('linkGoogle_socialVerificationId');
        sessionStorage.removeItem('linkGoogle_identityVerificationId');

        // Redirigir al perfil directamente
        window.location.href = '/dashboard/mi-perfil';
      } catch {
        setStatus('error');
        setError('Ocurrió un error inesperado');
      }
    }

    processCallback();
  }, [searchParams]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        {status === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="text-sm text-muted-foreground">Vinculando tu cuenta de Google...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-success-600 mx-auto" />
            <p className="text-base font-semibold text-foreground">¡Cuenta vinculada!</p>
            <p className="text-sm text-muted-foreground">
              Tu cuenta de Google ha sido vinculada exitosamente.
            </p>
            <Button onClick={() => router.push('/dashboard/mi-perfil')}>
              Volver a Mi Perfil
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-error-600 mx-auto" />
            <p className="text-base font-semibold text-foreground">Error al vincular</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => router.push('/dashboard/mi-perfil')}>
              Volver a Mi Perfil
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
