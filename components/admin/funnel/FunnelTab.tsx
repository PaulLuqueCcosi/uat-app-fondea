'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Globe, UserPlus, FileText, CheckCircle2 } from 'lucide-react';
import type { FunnelMetrics } from '@/modules/admin/admin-funnel.service';

interface Props {
  metrics: FunnelMetrics | null;
}

export function FunnelTab({ metrics }: Props) {
  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las métricas del embudo. Verifica que el backend y el calculator-service estén corriendo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    {
      icon: Globe,
      label: 'Intenciones anónimas',
      sublabel: 'Landing (calculadora)',
      count: metrics.anonymousIntentions,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      icon: UserPlus,
      label: 'Intenciones registradas',
      sublabel: `${metrics.linkedIntentions} del landing + ${metrics.portalIntentions} del portal`,
      count: metrics.totalUserIntentions,
      color: 'text-primary',
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      rate: metrics.conversionRates.landingToRegister,
      rateLabel: 'Landing → Registro',
    },
    {
      icon: FileText,
      label: 'Solicitudes enviadas',
      sublabel: 'Expedientes completos',
      count: metrics.applicationsSubmitted,
      color: 'text-warning-700',
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      rate: metrics.conversionRates.intentionToApplication,
      rateLabel: 'Intención → Solicitud',
    },
    {
      icon: CheckCircle2,
      label: 'Solicitudes aprobadas',
      sublabel: 'Pre-aprobadas + Aprobadas',
      count: metrics.applicationsApproved,
      color: 'text-success-700',
      bg: 'bg-success-50',
      border: 'border-success-200',
      rate: metrics.conversionRates.applicationToApproval,
      rateLabel: 'Solicitud → Aprobación',
    },
  ];

  // Calcular anchos relativos para el visual del embudo
  const maxCount = Math.max(...steps.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Período: {new Date(metrics.period.from).toLocaleDateString('es-PE')} — {new Date(metrics.period.to).toLocaleDateString('es-PE')}
        </p>
        <Badge variant="outline" className="text-xs">Últimos 30 días</Badge>
      </div>

      {/* Visual del embudo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Embudo de conversión</CardTitle>
          <CardDescription>Del landing a la aprobación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {steps.map((step, i) => {
            const widthPercent = Math.max(20, (step.count / maxCount) * 100);
            const Icon = step.icon;

            return (
              <div key={step.label}>
                {/* Flecha de conversión */}
                {i > 0 && step.rate !== undefined && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs">
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{step.rate}%</span>
                      <span className="text-muted-foreground">{step.rateLabel}</span>
                    </div>
                  </div>
                )}

                {/* Barra del embudo */}
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${step.bg} ${step.border}`}
                    style={{ width: `${widthPercent}%`, minWidth: '200px' }}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${step.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{step.sublabel}</p>
                    </div>
                    <p className={`text-xl font-bold ${step.color} shrink-0`}>{step.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cards de tasas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{metrics.conversionRates.landingToRegister}%</p>
            <p className="text-xs text-muted-foreground mt-1">Landing → Registro</p>
            <p className="text-[10px] text-muted-foreground">{metrics.linkedIntentions} de {metrics.anonymousIntentions} se registraron</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning-700">{metrics.conversionRates.intentionToApplication}%</p>
            <p className="text-xs text-muted-foreground mt-1">Intención → Solicitud</p>
            <p className="text-[10px] text-muted-foreground">{metrics.applicationsSubmitted} de {metrics.totalUserIntentions} solicitaron</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success-700">{metrics.conversionRates.applicationToApproval}%</p>
            <p className="text-xs text-muted-foreground mt-1">Solicitud → Aprobación</p>
            <p className="text-[10px] text-muted-foreground">{metrics.applicationsApproved} de {metrics.applicationsSubmitted} aprobadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
