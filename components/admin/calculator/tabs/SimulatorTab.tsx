'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Globe } from 'lucide-react';
import { LoanCalculatorProvider } from '@/components/LoanCalculator/core';
import { LoanCalculator } from '@/components/LoanCalculator/ui';
import type { LoanCalculatorApi, LoanConfig, LoanCalculation, IntentionRequest, IntentionResponse, LoanCalculatorTheme } from '@/components/LoanCalculator/core';

interface SimulatorTabProps {
  hasDrafts: boolean;
}

// ── Theme para el admin (más neutro) ──────────────────────────────────────────

const ADMIN_THEME: LoanCalculatorTheme = {
  primary: 'var(--color-primary-500)',
  primaryDark: 'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-50)',
  text: 'var(--color-neutral-800)',
  muted: 'var(--color-neutral-500)',
  border: 'var(--color-neutral-200)',
  background: '#FFFFFF',
  headerBg: 'var(--color-primary-500)',
  headerText: '#FFFFFF',
};

// ── Factory de API adapter por modo ───────────────────────────────────────────

function createAdminApi(mode: 'draft' | 'published'): LoanCalculatorApi {
  return {
    fetchConfig: async (): Promise<LoanConfig> => {
      const res = await fetch(`/api/admin/calculator-options?mode=${mode}`);
      if (!res.ok) throw new Error(`fetchConfig: ${res.status}`);
      const data = await res.json();

      const FIXED_COLORS = [
        { color: '#EF4444' },
        { color: '#F59E0B' },
        { color: '#10B981' },
      ];

      const rawRanges = data.scoreRanges ?? data.creditScoreRanges ?? [];
      const ranges = rawRanges
        .filter((r: any) => r.isActive !== false)
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
        .map((r: any, idx: number) => ({
          code: r.code,
          label: r.label,
          color: FIXED_COLORS[idx]?.color ?? r.color,
        }));

      const amounts = (data.amounts ?? []).map((a: any) => ({
        value: a.value,
        label: a.label,
        terms: (a.terms ?? []).map((t: any) => ({
          value: t.value,
          label: t.label,
          installments: (t.installments ?? []).map((i: any) => ({
            value: i.value,
            label: i.label,
          })),
        })),
      }));

      return {
        productId: data.product?.id ?? '',
        amounts,
        creditScoreRanges: ranges,
      };
    },

    fetchCalculation: async (
      amount: number,
      termDays: number,
      installments: number,
      config: LoanConfig,
      signal?: AbortSignal
    ): Promise<LoanCalculation> => {
      const res = await fetch(`/api/admin/simulate?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: config.productId,
          amount,
          termDays,
          installmentCount: installments,
          isFirstLoan: true,
          creditScore: 450, // Score medio por defecto para admin
        }),
        signal,
      });
      if (!res.ok) throw new Error(`simulate: ${res.status}`);

      const raw = await res.json();
      // La respuesta del draft viene envuelta en { _using, simulation }
      const data = raw.simulation ?? raw;

      // Si es array (formato normal del simulate público)
      if (Array.isArray(data)) {
        const scores: Record<string, any> = {};
        for (const item of data) {
          const sim = item.simulation;
          scores[item.rangeCode.toLowerCase()] = {
            total: sim.summary.totalToPay,
            cuotaAmt: sim.installmentCount > 1 ? +(sim.summary.totalToPay / sim.installmentCount).toFixed(2) : sim.summary.totalToPay,
            color: '#10B981',
            lightBg: 'rgba(16,185,129,0.08)',
            fees: [],
            discounts: [],
            totalFeesOriginal: 0,
            totalFeesWithPercentageDiscounts: 0,
            totalPercentageDiscounts: 0,
            totalFixedDiscounts: 0,
            totalFeesWithFixedDiscounts: 0,
            totalFeesResult: 0,
            igv: 0,
            schedule: (sim.schedule ?? []).map((s: any) => ({
              installmentNo: s.installmentNo,
              label: s.dueDate,
              amount: s.amount,
            })),
          };
        }
        return { scores };
      }

      // Formato simple (objeto directo)
      return { scores: data.scores ?? {} };
    },

    createIntention: async (_data: IntentionRequest): Promise<IntentionResponse> => {
      // Admin no crea intenciones — solo simula
      throw new Error('Admin simulator: createIntention not supported');
    },

    portalUrl: '',
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SimulatorTab({ hasDrafts }: SimulatorTabProps) {
  const draftApi = useMemo(() => createAdminApi('draft'), []);
  const publishedApi = useMemo(() => createAdminApi('published'), []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <FlaskConical className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          Compara la simulación entre la configuración actual (publicada) y el borrador.
        </p>
      </div>

      {/* 2 calculadoras lado a lado */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Draft */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-warning-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-warning-600" />
                Borrador (DRAFT)
              </CardTitle>
              <Badge variant="warning" className="text-[10px]">
                {hasDrafts ? 'CON CAMBIOS' : 'SIN CAMBIOS'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <LoanCalculatorProvider api={draftApi} theme={ADMIN_THEME}>
              <LoanCalculator
                submitLabel=""
                dedicated={false}
                detailMode="modal"
              />
            </LoanCalculatorProvider>
          </CardContent>
        </Card>

        {/* Published */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 bg-success-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-success-600" />
                Publicada (LIVE)
              </CardTitle>
              <Badge variant="success" className="text-[10px]">ACTIVA</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <LoanCalculatorProvider api={publishedApi} theme={ADMIN_THEME}>
              <LoanCalculator
                submitLabel=""
                dedicated={false}
                detailMode="modal"
              />
            </LoanCalculatorProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
