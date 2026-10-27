'use client';

import { Layers, Receipt, Tag, FlaskConical, ArrowRight, CircleCheck } from 'lucide-react';
import type { ActiveSummary } from '@/modules/admin/calculator-admin.service';

/**
 * Barra de orientación de /admin/calculator. PURAMENTE VISUAL: explica en qué orden se
 * encadenan las tres configuraciones (Oferta → Composición de cargos → Precios) y que el
 * Simulador prueba el resultado. Muestra la versión activa de cada una si llega en el
 * summary, pero no dispara ninguna acción — solo orienta al admin.
 */

interface Props {
  summary: ActiveSummary | null;
}

interface StepDef {
  n: string;
  icon: typeof Layers;
  name: string;
  desc: string;
  activeVersion?: number | null;
}

export function CalculatorFlowSteps({ summary }: Props) {
  const steps: StepDef[] = [
    {
      n: '1',
      icon: Layers,
      name: 'Oferta',
      desc: 'Qué montos, plazos, cuotas y rangos de score existen para el cliente.',
      activeVersion: summary?.AVAILABILITY?.version ?? null,
    },
    {
      n: '2',
      icon: Receipt,
      name: 'Composición de cargos',
      desc: 'Cómo se reparte un total entre cargos: interés, gastos, tarifa…',
      activeVersion: summary?.FEE_GROUPS?.version ?? null,
    },
    {
      n: '3',
      icon: Tag,
      name: 'Precios',
      desc: 'Cuánto se cobra y qué descuentos según el score y el tipo de cliente.',
      activeVersion: summary?.PRICING_RULES?.version ?? null,
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-4 md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        Así se arma el precio de un préstamo
      </p>

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.n} className="flex flex-1 items-stretch gap-0">
              <div className="flex flex-1 flex-col gap-1.5 md:px-4 md:first:pl-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {step.n}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
                    <Icon className="h-3.5 w-3.5 text-primary-600" />
                    {step.name}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                {step.activeVersion != null ? (
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-success-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                    v{step.activeVersion} activa
                  </span>
                ) : (
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                    sin versión activa
                  </span>
                )}
              </div>

              {i < steps.length - 1 && (
                <div className="hidden items-center text-neutral-300 md:flex">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Separador hacia el simulador */}
        <div className="hidden items-center text-neutral-300 md:flex">
          <ArrowRight className="h-5 w-5" />
        </div>

        {/* Paso final — Simulador (no es una config, prueba el resultado) */}
        <div className="flex flex-1 flex-col gap-1.5 opacity-90 md:px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-400 text-primary-foreground">
              <CircleCheck className="h-3.5 w-3.5" />
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
              <FlaskConical className="h-3.5 w-3.5 text-neutral-500" />
              Simulador
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Probar el resultado final antes de activar un cambio.
          </p>
        </div>
      </div>
    </div>
  );
}
