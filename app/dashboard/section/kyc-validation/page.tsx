import { FunnelKYCValidation } from '@/components/forms/funnel/FunnelKYCValidation';
import { getKYCData } from '@/app/actions/kyc.actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardKYCValidationPage() {
  const { data, blocked, blockedMinutesLeft, attemptsLeft } = await getKYCData();
  const isVerified = data?.verified === true;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-fondea-text">
        <Link href="/dashboard" className="hover:text-primary transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-fondea-text">Expediente</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-dark font-medium">Verificación KYC</span>
      </nav>

      {/* Header de sección */}
      <Card>
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-dark">Verificación de identidad (KYC)</h1>
              <Badge variant={isVerified ? 'completed' : blocked ? 'error' : 'pending'}>
                {isVerified ? 'Verificado' : blocked ? 'Bloqueado' : 'Pendiente'}
              </Badge>
            </div>
            <p className="text-sm text-fondea-text leading-relaxed">
              Necesitamos confirmar tu identidad con los datos de tu DNI antes de procesar cualquier solicitud.
              Esta verificación se realiza una sola vez y es requerida por regulación.
            </p>

            {/* Estado contextual */}
            {isVerified && (
              <div className="mt-3 flex items-center gap-2 text-sm text-secondary font-medium">
                <ShieldCheck className="w-4 h-4" />
                Tu identidad fue verificada correctamente. Puedes editar si necesitas corregir algo.
              </div>
            )}
            {blocked && (
              <div className="mt-3 flex items-center gap-2 text-sm text-destructive font-medium">
                <ShieldAlert className="w-4 h-4" />
                Verificación bloqueada temporalmente por intentos fallidos. Vuelve en {blockedMinutesLeft} min.
              </div>
            )}
            {!isVerified && !blocked && (
              <div className="mt-3 flex items-center gap-2 text-sm text-fondea-text">
                <span className="inline-flex items-center gap-1.5">
                  Tienes
                  <span className="font-semibold text-dark">{attemptsLeft} intentos</span>
                  disponibles antes de un bloqueo temporal.
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Formulario */}
      <FunnelKYCValidation
        dashboardMode={true}
        initialData={data}
        initialBlocked={blocked}
        initialBlockedMinutesLeft={blockedMinutesLeft}
        initialAttemptsLeft={attemptsLeft}
      />
    </div>
  );
}
