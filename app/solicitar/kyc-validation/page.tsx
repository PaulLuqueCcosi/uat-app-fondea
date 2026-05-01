import { FunnelKYCValidation } from '@/components/forms/solicitar/KYCValidation';
import { getKYCData } from '@/app/actions/kyc.actions';

export default async function KYCValidationPage() {
  const { data, blocked, blockedHoursLeft, attemptsLeft, backendUnavailable } = await getKYCData();

  if (backendUnavailable) {
    return (
      <div className="py-4">
        <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-3">
            <p className="text-2xl">⚠️</p>
            <h2 className="text-base font-semibold text-destructive">
              Servicio temporalmente no disponible
            </h2>
            <p className="text-sm text-muted-foreground">
              No pudimos conectarnos con el servidor. Por favor, inténtalo de nuevo en unos minutos.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Si el problema persiste, contacta a soporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <FunnelKYCValidation
          initialData={data}
          initialBlocked={blocked}
          initialBlockedHoursLeft={blockedHoursLeft}
          initialAttemptsLeft={attemptsLeft}
        />
      </div>
    </div>
  );
}
