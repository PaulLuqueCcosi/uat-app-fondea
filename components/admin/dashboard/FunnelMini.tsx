'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface FunnelMiniProps {
  funnel: {
    anonymousIntentions: number;
    userIntentions: number;
    applicationsSubmitted: number;
    applicationsApproved: number;
    creditsDisbursed: number;
    landingToRegisterRate: number;
    intentionToAppRate: number;
    appToApprovalRate: number;
    approvalToDisburseRate: number;
  };
}

export function FunnelMini({ funnel }: FunnelMiniProps) {
  const steps = [
    { label: 'Anónimas', value: funnel.anonymousIntentions, nextRate: funnel.landingToRegisterRate },
    { label: 'Usuario', value: funnel.userIntentions, nextRate: funnel.intentionToAppRate },
    { label: 'Solicitudes', value: funnel.applicationsSubmitted, nextRate: funnel.appToApprovalRate },
    { label: 'Aprobadas', value: funnel.applicationsApproved, nextRate: funnel.approvalToDisburseRate },
    { label: 'Desembolsadas', value: funnel.creditsDisbursed, nextRate: null },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Embudo de Conversión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 overflow-x-auto">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 md:gap-4">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-lg font-bold">{step.value.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {step.label}
                </span>
              </div>
              {step.nextRate !== null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span className="font-medium text-primary whitespace-nowrap">
                    {step.nextRate.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
