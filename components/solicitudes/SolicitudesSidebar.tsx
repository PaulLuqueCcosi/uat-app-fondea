'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, FileText, Camera, PenLine, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplicationFullDetailAction, type ApplicationFullDetail } from '@/app/actions/application.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CreditCard } from 'lucide-react';

const SOLICITUD_STEPS = [
  {
    id: 'kyc-docs',
    title: 'Documentos DNI',
    description: 'Verificación de identidad',
    icon: FileText,
    path: 'kyc-documentos'
  },
  {
    id: 'kyc-selfie',
    title: 'Selfie',
    description: 'Verificación biométrica',
    icon: Camera,
    path: 'kyc-selfie'
  },
  {
    id: 'contrato',
    title: 'Contrato',
    description: 'Firmar contrato',
    icon: PenLine,
    path: 'contrato'
  }
];

export function SolicitudesSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const solicitudId = params.id as string | undefined;

  const [loanData, setLoanData] = useState<ApplicationFullDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!solicitudId) return;

    const fetchLoanData = async () => {
      try {
        const data = await getApplicationFullDetailAction(solicitudId);
        if (data) {
          setLoanData(data);
        }
      } catch (error) {
        console.error('Error fetching loan data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, [solicitudId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getCurrentStepIndex = () => {
    if (pathname.includes('kyc-documentos')) return 0;
    if (pathname.includes('kyc-selfie')) return 1;
    if (pathname.includes('contrato')) return 2;
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <aside className="hidden md:flex flex-col w-80 bg-white border-r border-border fixed left-0 top-16 bottom-0 overflow-y-auto">
      <div className="p-6">
        {/* Card de resumen de solicitud - Bloqueado */}
        {loading ? (
          <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-pulse">
            <CardContent className="p-4">
              <div className="h-24"></div>
            </CardContent>
          </Card>
        ) : loanData ? (
          <Card className="mb-6 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-sm border-primary/20">
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-medium text-primary/70 uppercase tracking-wide">
                    Tu Solicitud
                  </h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(loanData.principal)}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-3">
                {/* Cuotas */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Cuotas</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {loanData.installment_count}x de {formatCurrency(loanData.monthly_payment)}
                    </p>
                  </div>
                </div>

                {/* Primera cuota */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Primera cuota</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatDate(loanData.first_due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mb-2">
          <h2 className="text-lg font-bold text-dark">Proceso de Solicitud</h2>
        </div>

        <nav className="space-y-1">
          {/* Grupo de formularios completados (bloqueados) */}
          <div className="relative">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">Formularios</p>
                <p className="text-xs text-fondea-text mt-0.5">Información completada</p>
              </div>
              <Lock className="w-4 h-4 text-fondea-text" />
            </div>

            {/* Línea conectora */}
            <div className="absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)] bg-secondary" />
          </div>

          {/* Pasos activos de solicitud */}
          {SOLICITUD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const stepPath = `/solicitudes/${solicitudId}/${step.path}`;
            const isActive = pathname === stepPath;

            return (
              <Link
                key={step.id}
                href={stepPath}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : isCompleted
                    ? 'text-dark hover:bg-background'
                    : 'text-fondea-text hover:bg-background',
                  !isCompleted && !isCurrent && 'opacity-50'
                )}
              >
                {/* Line connector */}
                {index < SOLICITUD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[26px] top-[44px] w-px h-[calc(100%-4px)]',
                      isCompleted ? 'bg-secondary' : 'bg-border'
                    )}
                  />
                )}

                {/* Step icon */}
                <div className="relative z-10 flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-dark" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      <Icon className="w-4 h-4 text-fondea-text" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-fondea-text">
                      Paso {index + 2}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium mt-0.5',
                      isActive ? 'text-primary' : isCompleted ? 'text-dark' : 'text-fondea-text'
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
    </aside>
  );
}
