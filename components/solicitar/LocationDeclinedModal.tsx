'use client';

import { MapPin, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type GPSPermissionError } from '@/lib/client-api/device-fingerprint';

interface LocationDeclinedModalProps {
  open: boolean;
  onRetry: () => void;      // Pedir ubicación de nuevo
  onContinue: () => void;   // Continuar sin ubicación
  gpsError?: GPSPermissionError;
}

function getErrorMessage(error?: GPSPermissionError): string {
  if (!error) return 'No se pudo obtener tu ubicación.';

  switch (error) {
    case 'PERMISSION_DENIED':
      return 'El navegador bloqueó el acceso a tu ubicación. Para habilitarlo: haz clic en el icono 🔒 o ⚠️ junto a la URL de esta página, busca "Ubicación" y selecciona "Permitir".';
    case 'POSITION_UNAVAILABLE':
      return 'No se pudo determinar tu ubicación. Verifica que tu dispositivo tenga GPS activado o una conexión estable.';
    case 'TIMEOUT':
      return 'La solicitud de ubicación tardó demasiado. Intenta de nuevo en un lugar con mejor señal.';
    case 'NOT_SUPPORTED':
      return 'Tu navegador no soporta geolocalización. Intenta con otro navegador (Chrome, Edge, Safari).';
    default:
      return 'No se pudo obtener tu ubicación.';
  }
}

export function LocationDeclinedModal({ open, onRetry, onContinue, gpsError }: LocationDeclinedModalProps) {
  const isRetryDisabled = gpsError === 'PERMISSION_DENIED' || gpsError === 'NOT_SUPPORTED';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onContinue()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-warning" />
          </div>
          <DialogTitle className="text-center text-xl">
            Ubicación no compartida
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            No has permitido el acceso a tu ubicación. Esto puede afectar tu score de evaluación, ya que usamos tu ubicación para verificar que estás en Perú y proteger tu solicitud contra fraudes.
          </DialogDescription>
        </DialogHeader>

        {gpsError && (
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{getErrorMessage(gpsError)}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={onRetry}
            variant="default"
            className="w-full"
            disabled={isRetryDisabled}
          >
            Intentar de nuevo
          </Button>
          <Button onClick={onContinue} variant="outline" className="w-full">
            Continuar sin ubicación
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Si continúas sin ubicación, tu solicitud podría ser evaluada con mayor restricción.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
