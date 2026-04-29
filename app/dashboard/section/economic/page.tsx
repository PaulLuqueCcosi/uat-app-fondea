import { FunnelEconomicProfileShadcn } from '@/components/forms/solicitar/EconomicProfileShadcn';
import { getEconomicProfileStatus } from '@/app/actions/economic.actions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardEconomicPage() {
  const economicStatus = await getEconomicProfileStatus();
  const isVerified = economicStatus.overall_verified;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-fondea-text">
        <Link href="/dashboard" className="hover:text-primary transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-fondea-text">Expediente</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-dark font-medium">Perfil Económico</span>
      </nav>

      {/* Header */}
      <Card>
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-dark">Perfil Económico</h1>
              <Badge variant={isVerified ? 'completed' : 'pending'}>
                {isVerified ? 'Completado' : 'Pendiente'}
              </Badge>
            </div>
            <p className="text-sm text-fondea-text leading-relaxed">
              Tu situación financiera, patrimonio y deudas nos ayudan a evaluar tu capacidad
              de pago y ofrecerte las mejores condiciones.
            </p>
            {isVerified && (
              <div className="mt-3 flex items-center gap-2 text-sm text-secondary font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Información registrada. Puedes editarla si algo cambió.
              </div>
            )}
            {!isVerified && (
              <div className="mt-3 text-sm text-fondea-text">
                Completa tu perfil económico para continuar con tu solicitud.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Formulario */}
      <FunnelEconomicProfileShadcn
        dashboardMode={true}
        initialData={economicStatus}
      />
    </div>
  );
}
