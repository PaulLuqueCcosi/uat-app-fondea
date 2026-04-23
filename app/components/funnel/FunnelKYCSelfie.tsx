'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Camera, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { verifyBiometric } from '@/app/actions/loan.actions';

export function FunnelKYCSelfie() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selfie, setSelfie] = useState<string>('');
  const [verified, setVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setSelfie(preview);
      setVerified(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!selfie) {
      setError('Debes capturar una selfie primero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyBiometric(selfie);
      if (result.success) {
        setVerified(true);
        // Wait a moment to show success, then continue
        setTimeout(() => {
          router.push('/funnel/waiting');
        }, 1500);
      } else {
        setError(result.error || 'No pudimos verificar tu identidad. Intenta nuevamente.');
      }
    } catch (err) {
      console.error('Error verifying biometric:', err);
      setError('Error en la verificación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setSelfie('');
    setVerified(false);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Verificación Facial
        </h1>
        <p className="text-fondea-text">
          Toma una selfie para verificar que eres tú.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Instructions */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold text-dark mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Consejos para una buena selfie
          </h3>
          <ul className="text-sm text-dark space-y-1 ml-7 list-disc">
            <li>Asegúrate de estar en un lugar bien iluminado</li>
            <li>Mira directamente a la cámara</li>
            <li>Retira lentes, gorros o cualquier accesorio que cubra tu rostro</li>
            <li>Mantén un gesto neutral (sin sonreír exageradamente)</li>
            <li>Tu rostro debe ocupar la mayor parte del encuadre</li>
          </ul>
        </div>

        {/* Camera/Preview area */}
        <div className="relative">
          {!selfie ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] bg-background border-2 border-dashed border-border hover:border-primary rounded-lg flex flex-col items-center justify-center transition-colors"
              >
                <Camera className="w-16 h-16 text-fondea-text mb-4" />
                <p className="text-lg font-medium text-dark mb-1">
                  Tomar selfie
                </p>
                <p className="text-sm text-fondea-text">
                  Click para abrir la cámara
                </p>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selfie}
                  alt="Tu selfie"
                  className="w-full aspect-[4/3] object-cover rounded-lg"
                />
                {verified && (
                  <div className="absolute inset-0 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <div className="bg-white rounded-full p-4 shadow-lg">
                      <CheckCircle className="w-12 h-12 text-secondary" />
                    </div>
                  </div>
                )}
              </div>

              {!verified && (
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleRetake}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tomar otra
                  </Button>
                  <Button
                    onClick={handleVerify}
                    loading={loading}
                    className="flex-1"
                  >
                    Verificar identidad
                  </Button>
                </div>
              )}

              {verified && (
                <div className="bg-secondary/10 border border-secondary rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-dark">
                    ✓ Identidad verificada correctamente
                  </p>
                  <p className="text-xs text-fondea-text mt-1">
                    Redirigiendo...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Security note */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <p className="text-xs text-fondea-text text-center">
            🔒 Tu foto será encriptada y usada únicamente para verificación de identidad.
            No será compartida con terceros.
          </p>
        </div>
      </Card>
    </div>
  );
}
