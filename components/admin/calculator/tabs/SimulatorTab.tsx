'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FlaskConical, Layers, Receipt, Tag } from 'lucide-react';
import { getVersionsAction, getVersionByIdAction } from '@/app/actions/calculator-admin.actions';
import type { ConfigVersion, AvailabilityConfig } from '@/modules/admin/calculator-admin.service';
import { LoanCalculatorProvider } from '@/components/LoanCalculator/core';
import { LoanCalculator } from '@/components/LoanCalculator/ui';
import type { LoanCalculatorApi, LoanConfig, LoanCalculation, IntentionRequest, IntentionResponse, LoanCalculatorTheme } from '@/components/LoanCalculator/core';

interface VersionOption {
  id: string;
  version: number;
  label: string;
  status: string;
}

const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';

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

export function SimulatorTab() {
  // ── Versiones disponibles ───────────────────────────────────────────────
  const [availabilityVersions, setAvailabilityVersions] = useState<VersionOption[]>([]);
  const [feeGroupsVersions, setFeeGroupsVersions] = useState<VersionOption[]>([]);
  const [pricingRulesVersions, setPricingRulesVersions] = useState<VersionOption[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);

  // ── Selección del usuario ───────────────────────────────────────────────
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [selectedFeeGroups, setSelectedFeeGroups] = useState<string>('');
  const [selectedPricingRules, setSelectedPricingRules] = useState<string>('');

  // ── Opciones dinámicas de la disponibilidad ─────────────────────────────
  const [availabilityData, setAvailabilityData] = useState<AvailabilityConfig | null>(null);

  // ── Primer préstamo toggle ──────────────────────────────────────────────
  const [isFirstLoan, setIsFirstLoan] = useState(true);

  // ── Cargar versiones al montar ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingVersions(true);
      const [avail, fees, rules] = await Promise.all([
        getVersionsAction('AVAILABILITY'),
        getVersionsAction('FEE_GROUPS'),
        getVersionsAction('PRICING_RULES'),
      ]);
      const map = (list: ConfigVersion[]): VersionOption[] =>
        list.map((v) => ({ id: v.id, version: v.version, label: `v${v.version} — ${v.name ?? 'Sin nombre'}${v.isActive ? ' ✓' : ''}`, status: v.isActive ? 'active' : 'inactive' }));

      setAvailabilityVersions(map(avail));
      setFeeGroupsVersions(map(fees));
      setPricingRulesVersions(map(rules));

      const activeA = avail.find((v) => v.isActive);
      const activeF = fees.find((v) => v.isActive);
      const activeR = rules.find((v) => v.isActive);
      if (activeA) setSelectedAvailability(activeA.id);
      if (activeF) setSelectedFeeGroups(activeF.id);
      if (activeR) setSelectedPricingRules(activeR.id);
      setLoadingVersions(false);
    }
    load();
  }, []);

  // ── Cargar opciones cuando cambia la versión de disponibilidad ───────────
  useEffect(() => {
    if (!selectedAvailability) return;
    async function loadAvailability() {
      const ver = await getVersionByIdAction('AVAILABILITY', selectedAvailability);
      if (!ver?.data) return;
      setAvailabilityData(ver.data as AvailabilityConfig);
    }
    loadAvailability();
  }, [selectedAvailability]);

  // ── API adapter para la calculadora visual ──────────────────────────────
  const createVisualApi = useCallback((): LoanCalculatorApi | null => {
    if (!selectedAvailability || !selectedFeeGroups || !selectedPricingRules || !availabilityData) return null;
    return {
      fetchConfig: async (): Promise<LoanConfig> => {
        const res = await fetch(`/api/admin/calculator-options?availabilityVersionId=${selectedAvailability}`);
        if (!res.ok) throw new Error(`fetchConfig: ${res.status}`);
        const data = await res.json();

        const FIXED_COLORS = [{ color: '#EF4444' }, { color: '#F59E0B' }, { color: '#10B981' }];
        const ranges = (data.scoreRanges ?? [])
          .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
          .map((r: any, idx: number) => ({ code: r.code, label: r.label, color: FIXED_COLORS[idx]?.color ?? r.color }));

        return { productId: data.product?.id ?? PRODUCT_ID, amounts: data.amounts ?? [], creditScoreRanges: ranges };
      },
      fetchCalculation: async (amt, term, inst, config, signal): Promise<LoanCalculation> => {
        const res = await fetch('/api/admin/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: PRODUCT_ID,
            amount: amt,
            termDays: term,
            installmentCount: inst,
            isFirstLoan,
            availabilityVersionId: selectedAvailability,
            feeGroupsVersionId: selectedFeeGroups,
            pricingRulesVersionId: selectedPricingRules,
          }),
          signal,
        });
        if (!res.ok) throw new Error(`simulate: ${res.status}`);
        const data = await res.json();

        const scores: Record<string, any> = {};
        const COLORS = [
          { color: '#EF4444', lightBg: 'rgba(239,68,68,0.08)' },
          { color: '#F59E0B', lightBg: 'rgba(245,158,11,0.08)' },
          { color: '#10B981', lightBg: 'rgba(16,185,129,0.08)' },
        ];

        if (Array.isArray(data)) {
          for (const item of data) {
            if (!item.simulation) continue;
            const sim = item.simulation;
            const idx = config.creditScoreRanges.findIndex(
              (r) => r.code.toLowerCase() === item.rangeCode.toLowerCase()
            );

            // Mapear fees con discountHistory (igual que fondeaPortalApi)
            const fees = Object.entries(sim.fees ?? {}).map(([key, f]: [string, any]) => ({
              key,
              name: f.name,
              label: f.label ?? f.name,
              originalAmount: f.originalAmount,
              discountAmount: f.discountAmount,
              finalAmount: f.finalAmount,
              discountHistory: (f.discountHistory ?? []).map((h: any) => ({
                code: h.code, label: h.label,
                amountBefore: h.amountBefore, discountAmount: h.discountAmount,
                amountAfter: h.amountAfter, value: h.value,
              })),
            }));

            // Aplanar discounts (percentage + fixed)
            const allDiscounts: any[] = [];
            if (sim.discounts?.percentage) allDiscounts.push(...Object.values(sim.discounts.percentage));
            if (sim.discounts?.fixed) allDiscounts.push(...Object.values(sim.discounts.fixed));
            const discounts = allDiscounts.map((d: any) => ({
              key: d.name, name: d.name, label: d.label ?? d.name,
              type: d.type, calculationType: d.calculationType,
              totalDiscountAmount: d.totalDiscountAmount, value: d.value,
            })).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

            // Schedule con fecha formateada
            const schedule = (sim.schedule ?? []).map((s: any) => ({
              installmentNo: s.installmentNo,
              label: s.dueDate,
              amount: s.amount,
            }));

            const total = sim.summary.totalToPay;
            scores[item.rangeCode.toLowerCase()] = {
              total,
              cuotaAmt: inst > 1 ? +(total / inst).toFixed(2) : total,
              color: COLORS[idx]?.color ?? item.rangeColor,
              lightBg: COLORS[idx]?.lightBg ?? 'rgba(0,0,0,0.05)',
              fees,
              discounts,
              totalFeesOriginal: sim.summary.totalFeesOriginal,
              totalPercentageDiscounts: sim.summary.totalPercentageDiscounts,
              totalFeesWithPercentageDiscounts: sim.summary.totalFeesWithPercentageDiscounts,
              totalFixedDiscounts: sim.summary.totalFixedDiscounts ?? 0,
              totalFeesWithFixedDiscounts: sim.summary.totalFeesWithFixedDiscounts ?? 0,
              totalFeesResult: sim.summary.totalFeesResult,
              igv: sim.summary.totalIgvFromTotalFeesResult,
              schedule,
            };
          }
        }
        return { scores };
      },
      createIntention: async (_data: IntentionRequest): Promise<IntentionResponse> => {
        throw new Error('Admin: not supported');
      },
      portalUrl: '',
    };
  }, [selectedAvailability, selectedFeeGroups, selectedPricingRules, availabilityData, isFirstLoan]);

  const visualApi = createVisualApi();

  // ── Helper badges ───────────────────────────────────────────────────────
  const getStatusBadge = (versions: VersionOption[], selectedId: string) => {
    const v = versions.find((x) => x.id === selectedId);
    if (!v) return null;
    if (v.status === 'active') return <Badge className="bg-green-50 text-green-700 border-green-200 text-[9px]">Activa</Badge>;
    return null;
  };

  if (loadingVersions) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <FlaskConical className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm text-foreground">
          Elige qué versión de cada configuración usar y simula el resultado.
        </p>
      </div>

      {/* Selectores de versiones + primer préstamo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configuración a simular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Disponibilidad</Label>
                {getStatusBadge(availabilityVersions, selectedAvailability)}
              </div>
              <select value={selectedAvailability} onChange={(e) => setSelectedAvailability(e.target.value)} className="w-full h-8 text-xs rounded border border-input bg-background px-2">
                <option value="">Seleccionar...</option>
                {availabilityVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Tarifas</Label>
                {getStatusBadge(feeGroupsVersions, selectedFeeGroups)}
              </div>
              <select value={selectedFeeGroups} onChange={(e) => setSelectedFeeGroups(e.target.value)} className="w-full h-8 text-xs rounded border border-input bg-background px-2">
                <option value="">Seleccionar...</option>
                {feeGroupsVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Reglas de Pricing</Label>
                {getStatusBadge(pricingRulesVersions, selectedPricingRules)}
              </div>
              <select value={selectedPricingRules} onChange={(e) => setSelectedPricingRules(e.target.value)} className="w-full h-8 text-xs rounded border border-input bg-background px-2">
                <option value="">Seleccionar...</option>
                {pricingRulesVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFirstLoan}
                onChange={(e) => setIsFirstLoan(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-xs">Simular como primer préstamo</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Calculadora */}
      {visualApi ? (
        <div key={`${selectedAvailability}-${selectedFeeGroups}-${selectedPricingRules}-${isFirstLoan}`}>
          <LoanCalculatorProvider api={visualApi} theme={ADMIN_THEME}>
            <LoanCalculator
              submitLabel=""
              dedicated={false}
              detailMode="modal"
            />
          </LoanCalculatorProvider>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Selecciona las 3 versiones de configuración para ver la calculadora.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
