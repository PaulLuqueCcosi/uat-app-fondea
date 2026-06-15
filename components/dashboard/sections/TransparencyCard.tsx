'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, ShieldAlert, Ban, Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getTransparencyConfig } from '@/app/actions/passport.actions';
import type { TransparencyConfig, ScenarioSeverity } from '@/modules/passport';

/**
 * Transparencia FONDEA — Cards de escenarios de mora.
 * Muestra claramente qué pasa si pagas puntual vs si te atrasas.
 * Los datos vienen del módulo (pueden variar por producto).
 */

// ── Helper: icono y colores según severidad ───────────────────────────────────

const severityStyles: Record<ScenarioSeverity, {
  icon: typeof CheckCircle;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
}> = {
  positive: {
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    borderColor: 'border-success-200',
    iconColor: 'text-success-600',
    titleColor: 'text-success-900',
  },
  low: {
    icon: AlertTriangle,
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-200',
    iconColor: 'text-warning-600',
    titleColor: 'text-warning-900',
  },
  medium: {
    icon: ShieldAlert,
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-100',
    iconColor: 'text-warning-700',
    titleColor: 'text-warning-900',
  },
  high: {
    icon: Ban,
    bgColor: 'bg-error-50',
    borderColor: 'border-error-200',
    iconColor: 'text-error-600',
    titleColor: 'text-error-900',
  },
  critical: {
    icon: Ban,
    bgColor: 'bg-error-50',
    borderColor: 'border-error-300',
    iconColor: 'text-error-700',
    titleColor: 'text-error-900',
  },
};

// ── Helper: formatear penalidad ───────────────────────────────────────────────

function formatPenalty(amount: number, currency: string): string {
  const symbols: Record<string, string> = { PEN: 'S/', USD: '$', EUR: '€' };
  return `${symbols[currency] ?? currency} ${amount}`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function TransparencyCard() {
  const [config, setConfig] = useState<TransparencyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransparencyConfig().then((result) => {
      if (result.ok) setConfig(result.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Transparencia FONDEA
          </span>
        </CardTitle>
        <CardDescription>
          Sin letras pequeñas. Esto es lo que pasa según cuándo pagues.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Grid de escenarios */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.scenarios.map((scenario) => {
            const style = severityStyles[scenario.severity] ?? severityStyles.low;
            const Icon = style.icon;
            const penaltyLabel = scenario.penaltyPerDay
              ? `${formatPenalty(scenario.penaltyPerDay, config.currency)}/día`
              : null;

            return (
              <div
                key={scenario.id}
                className={`rounded-lg border p-3 flex flex-col items-center text-center gap-2 ${style.bgColor} ${style.borderColor}`}
              >
                <Icon className={`w-6 h-6 ${style.iconColor}`} />
                <p className={`text-sm font-bold ${style.titleColor}`}>
                  {scenario.title}
                </p>
                <p className="text-xs font-medium text-foreground">
                  {penaltyLabel ?? scenario.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tip positivo */}
        <div className="flex items-center gap-2 rounded-lg bg-primary-50 border border-primary-200 p-3">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary-800">
            <span className="font-semibold">Tip:</span> {config.tip}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
