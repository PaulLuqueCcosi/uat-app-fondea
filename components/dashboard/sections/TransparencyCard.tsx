'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, ShieldAlert, Ban, Lightbulb } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
        {/* Grid de escenarios — responsive según cantidad */}
        <div className={`grid gap-3 ${
          config.scenarios.length <= 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : config.scenarios.length <= 6
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}>
          {config.scenarios.map((scenario) => {
            const style = severityStyles[scenario.severity] ?? severityStyles.low;

            // Si el backend envió un icono específico, usarlo
            const backendIcon = (scenario as any).icon;
            const backendColor = (scenario as any).color;
            let Icon = style.icon;
            if (backendIcon) {
              const iconPascal = backendIcon.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
              const LucideIcon = (LucideIcons as any)[iconPascal];
              if (LucideIcon) Icon = LucideIcon;
            }

            // Si el backend envió color, usar como override del icono
            const iconColorStyle = backendColor ? { color: backendColor } : {};

            const penaltyLabel = scenario.penaltyPerDay
              ? `${formatPenalty(scenario.penaltyPerDay, config.currency)}/día`
              : null;

            // Para rangos con type=PERCENTAGE, mostrar la descripción
            const displayLabel = penaltyLabel ?? (scenario as any).description ?? scenario.description;

            return (
              <div
                key={scenario.id}
                className={`rounded-lg border p-3 flex flex-col items-center text-center gap-1.5 ${style.bgColor} ${style.borderColor}`}
              >
                <Icon className={`w-6 h-6 ${backendColor ? '' : style.iconColor}`} style={iconColorStyle} />
                <p className={`text-sm font-bold ${style.titleColor}`}>
                  {scenario.title}
                </p>
                {scenario.fromDay > 0 && (
                  <p className="text-xs text-muted-foreground font-semibold">
                    {scenario.toDay === null
                      ? `Día ${scenario.fromDay}+`
                      : scenario.fromDay === scenario.toDay
                        ? `Día ${scenario.fromDay}`
                        : `Día ${scenario.fromDay} al ${scenario.toDay}`}
                  </p>
                )}
                <p className="text-xs font-medium text-foreground">
                  {displayLabel}
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
