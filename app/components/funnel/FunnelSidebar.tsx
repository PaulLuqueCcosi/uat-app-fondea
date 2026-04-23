'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  DollarSign,
  Users,
  MapPin,
  FileText,
  CreditCard,
  Camera,
  Building2,
  FileSignature,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    id: 1,
    title: 'Perfil Laboral',
    path: '/funnel/labor',
    icon: Briefcase,
    description: 'Información de trabajo',
  },
  {
    id: 2,
    title: 'Perfil Económico',
    path: '/funnel/economic',
    icon: DollarSign,
    description: 'Ingresos y gastos',
  },
  {
    id: 3,
    title: 'Referencias',
    path: '/funnel/references',
    icon: Users,
    description: 'Contactos de referencia',
  },
  {
    id: 4,
    title: 'Info Adicional',
    path: '/funnel/additional',
    icon: MapPin,
    description: 'Dirección y más',
  },
  {
    id: 5,
    title: 'Resumen',
    path: '/funnel/summary',
    icon: FileText,
    description: 'Revisar y enviar',
  },
  {
    id: 6,
    title: 'Evaluación',
    path: '/funnel/waiting',
    icon: Clock,
    description: 'Esperando resultado',
  },
  {
    id: 7,
    title: 'Documentos DNI',
    path: '/funnel/kyc-documents',
    icon: CreditCard,
    description: 'Verificación de identidad',
  },
  {
    id: 8,
    title: 'Selfie',
    path: '/funnel/kyc-selfie',
    icon: Camera,
    description: 'Verificación biométrica',
  },
  {
    id: 9,
    title: 'Cuenta Bancaria',
    path: '/funnel/bank-account',
    icon: Building2,
    description: 'Datos de desembolso',
  },
  {
    id: 10,
    title: 'Contrato',
    path: '/funnel/contract',
    icon: FileSignature,
    description: 'Firmar contrato',
  },
];

export function FunnelSidebar() {
  const pathname = usePathname();

  const getCurrentStepIndex = () => {
    const index = steps.findIndex(step => pathname === step.path);
    return index !== -1 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <aside className="hidden md:flex flex-col w-80 bg-white border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-dark">Proceso de Solicitud</h2>
          <p className="text-xs text-fondea-text mt-1">
            Paso {currentStepIndex + 1} de {steps.length}
          </p>
          <div className="mt-3 h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <nav className="space-y-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const status = getStepStatus(index);
            const isActive = pathname === step.path;

            return (
              <Link
                key={step.id}
                href={step.path}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : status === 'completed'
                    ? 'text-dark hover:bg-background'
                    : 'text-fondea-text hover:bg-background',
                  status === 'upcoming' && 'opacity-50'
                )}
              >
                {/* Line connector */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)]',
                      status === 'completed' ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}

                {/* Step icon/number */}
                <div className="relative z-10 flex-shrink-0">
                  {status === 'completed' ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  ) : status === 'current' ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      <Circle className="w-4 h-4 text-fondea-text" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-fondea-text">
                      Paso {step.id}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium mt-0.5',
                      isActive ? 'text-primary' : status === 'completed' ? 'text-dark' : 'text-fondea-text'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-fondea-text mt-0.5">
                    {step.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Estados alternativos */}
      {(pathname === '/funnel/approved' ||
        pathname === '/funnel/rejected' ||
        pathname === '/funnel/more-info' ||
        pathname === '/funnel/contract-signed') && (
        <div className="p-6 border-t border-border bg-background/50">
          <div className="text-center">
            {pathname === '/funnel/approved' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">¡Aprobado!</p>
                <p className="text-xs text-fondea-text mt-1">
                  Continúa con los siguientes pasos
                </p>
              </>
            )}
            {pathname === '/funnel/rejected' && (
              <>
                <Circle className="w-12 h-12 text-error mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">Solicitud Rechazada</p>
                <p className="text-xs text-fondea-text mt-1">
                  Revisa las razones
                </p>
              </>
            )}
            {pathname === '/funnel/more-info' && (
              <>
                <Clock className="w-12 h-12 text-warning mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">Más Información</p>
                <p className="text-xs text-fondea-text mt-1">
                  Completa los datos faltantes
                </p>
              </>
            )}
            {pathname === '/funnel/contract-signed' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-dark">¡Proceso Completo!</p>
                <p className="text-xs text-fondea-text mt-1">
                  Tu solicitud está lista
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
