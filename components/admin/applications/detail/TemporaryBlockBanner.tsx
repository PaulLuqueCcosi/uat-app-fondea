import { PauseCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/admin-formatters';
import type { VerificationInfo } from '@/modules/admin/admin-application-detail.service';

const STEP_LABELS: Record<string, string> = {
  DNI_FRONT: 'DNI frente',
  DNI_BACK: 'DNI reverso',
  SELFIE: 'Selfie',
};

/**
 * Tarjeta de pausa temporal de la pre-aprobación. No es un estado final: la solicitud sigue PRE_APPROVED
 * y el cliente podrá continuar cuando termine la pausa, salvo que la pre-aprobación venza antes.
 * Mismo estilo que la tarjeta "Motivo de fallo / rechazo" del resumen.
 */
export function TemporaryBlockBanner({ verification }: { verification: VerificationInfo | null }) {
  if (!verification?.temporarilyBlocked || !verification.blockedUntil) {
    return null;
  }
  const step = verification.blockedStep ? STEP_LABELS[verification.blockedStep] ?? verification.blockedStep : null;

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
          <PauseCircle className="h-4 w-4" /> Bloqueo temporal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-[11px] text-muted-foreground">Motivo</p>
          <p className="text-sm">
            {step ? `El cliente agotó los intentos de ${step}` : 'El cliente agotó los intentos de un paso de verificación'}
            . La pre-aprobación sigue vigente, en pausa.
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Se reanuda</p>
          <p className="text-sm font-medium">{formatDateTime(verification.blockedUntil)} (hora de Perú)</p>
        </div>
        {verification.expiresBeforeUnblock && (
          <p className="text-sm text-red-700">
            La pre-aprobación vence antes de que termine la pausa: el cliente no podrá continuar y tendrá que generar
            una nueva solicitud.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
