'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { FlaskConical, Play, Loader2, Layers, Receipt, Tag, Eye, SlidersHorizontal } from 'lucide-react';
import { getVersionsAction, getVersionByIdAction, simulateWithVersionsAction } from '@/app/actions/calculator-admin.actions';
import { toast } from 'sonner';
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
  const [simMode, setSimMode] = useState<'form' | 'visual'>('form');

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
  const [amounts, setAmounts] = useState<number[]>([]);
  const [terms, setTerms] = useState<number[]>([]);
  const [installments, setInstallments] = useState<number[]>([]);

  // ── Parámetros de simulación ────────────────────────────────────────────
  const [amount, setAmount] = useState(0);
  const [termDays, setTermDays] = useState(0);
  const [installmentCount, setInstallmentCount] = useState(0);
  const [isFirstLoan, setIsFirstLoan] = useState(true);
  const [creditScore, setCreditScore] = useState(450);

  // ── Resultados ──────────────────────────────────────────────────────────
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

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
        list.map((v) => ({ id: v.id, version: v.version, label: `v${v.version} — ${v.name ?? 'Sin nombre'} (${v.status})`, status: v.status }));

      setAvailabilityVersions(map(avail));
      setFeeGroupsVersions(map(fees));
      setPricingRulesVersions(map(rules));

      const activeA = avail.find((v) => v.status === 'ACTIVE');
      const activeF = fees.find((v) => v.status === 'ACTIVE');
      const activeR = rules.find((v) => v.status === 'ACTIVE');
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
      const data = ver.data as AvailabilityConfig;
      setAvailabilityData(data);

      // Extraer montos únicos
      const allAmounts = data.availability.flatMap((g) => g.amounts);
      const uniqueAmounts = [...new Set(allAmounts)].sort((a, b) => a - b);
      setAmounts(uniqueAmounts);
      if (uniqueAmounts.length > 0 && !uniqueAmounts.includes(amount)) {
        setAmount(uniqueAmounts[0]);
      }
    }
    loadAvailability();
  }, [selectedAvailability]);

  // ── Actualizar plazos cuando cambia el monto ────────────────────────────
  useEffect(() => {
    if (!availabilityData || !amount) return;
    const group = availabilityData.availability.find((g) => g.amounts.includes(amount));
    if (!group) { setTerms([]); setInstallments([]); return; }
    const allTerms = group.terms.flatMap((t) => t.terms);
    const uniqueTerms = [...new Set(allTerms)].sort((a, b) => a - b);
    setTerms(uniqueTerms);
    if (uniqueTerms.length > 0 && !uniqueTerms.includes(termDays)) {
      setTermDays(uniqueTerms[0]);
    }
  }, [availabilityData, amount]);

  // ── Actualizar cuotas cuando cambia el plazo ────────────────────────────
  useEffect(() => {
    if (!availabilityData || !amount || !termDays) return;
    const group = availabilityData.availability.find((g) => g.amounts.includes(amount));
    if (!group) { setInstallments([]); return; }
    const termEntry = group.terms.find((t) => t.terms.includes(termDays));
    if (!termEntry) { setInstallments([]); return; }
    const uniqueInst = [...new Set(termEntry.installments)].sort((a, b) => a - b);
    setInstallments(uniqueInst);
    if (uniqueInst.length > 0 && !uniqueInst.includes(installmentCount)) {
      setInstallmentCount(uniqueInst[0]);
    }
  }, [availabilityData, amount, termDays]);

  // ── Simular ─────────────────────────────────────────────────────────────
  const handleSimulate = async () => {
    if (!selectedAvailability || !selectedFeeGroups || !selectedPricingRules) {
      toast.error('Selecciona una versión para cada configuración');
      return;
    }
    if (!amount || !termDays || !installmentCount) {
      toast.error('Selecciona monto, plazo y cuotas');
      return;
    }
    setSimulating(true);
    setResult(null);
    const res = await simulateWithVersionsAction({
      productId: PRODUCT_ID,
      amount,
      termDays,
      installmentCount,
      isFirstLoan,
      creditScore,
      availabilityVersionId: selectedAvailability,
      feeGroupsVersionId: selectedFeeGroups,
      pricingRulesVersionId: selectedPricingRules,
    });
    setSimulating(false);
    if (res.ok) setResult(res.data);
    else toast.error(res.error ?? 'Error al simular');
  };

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
            isFirstLoan: true,
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
  }, [selectedAvailability, selectedFeeGroups, selectedPricingRules, availabilityData]);

  const visualApi = createVisualApi();

  // ── Helper badges ───────────────────────────────────────────────────────
  const getStatusBadge = (versions: VersionOption[], selectedId: string) => {
    const v = versions.find((x) => x.id === selectedId);
    if (!v) return null;
    if (v.status === 'ACTIVE') return <Badge className="bg-green-50 text-green-700 border-green-200 text-[9px]">ACTIVE</Badge>;
    if (v.status === 'DRAFT') return <Badge variant="outline" className="border-amber-300 text-amber-700 text-[9px]">DRAFT</Badge>;
    return <Badge variant="secondary" className="text-[9px]">ARCHIVED</Badge>;
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

      {/* Selectores de versiones (siempre visible) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configuración a simular</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Disponibilidad</Label>
                {getStatusBadge(availabilityVersions, selectedAvailability)}
              </div>
              <NativeSelect value={selectedAvailability} onChange={(e) => setSelectedAvailability(e.target.value)} className="text-xs">
                <NativeSelectOption value="">Seleccionar...</NativeSelectOption>
                {availabilityVersions.map((v) => (
                  <NativeSelectOption key={v.id} value={v.id}>{v.label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Tarifas</Label>
                {getStatusBadge(feeGroupsVersions, selectedFeeGroups)}
              </div>
              <NativeSelect value={selectedFeeGroups} onChange={(e) => setSelectedFeeGroups(e.target.value)} className="text-xs">
                <NativeSelectOption value="">Seleccionar...</NativeSelectOption>
                {feeGroupsVersions.map((v) => (
                  <NativeSelectOption key={v.id} value={v.id}>{v.label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Reglas de Pricing</Label>
                {getStatusBadge(pricingRulesVersions, selectedPricingRules)}
              </div>
              <NativeSelect value={selectedPricingRules} onChange={(e) => setSelectedPricingRules(e.target.value)} className="text-xs">
                <NativeSelectOption value="">Seleccionar...</NativeSelectOption>
                {pricingRulesVersions.map((v) => (
                  <NativeSelectOption key={v.id} value={v.id}>{v.label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle modo: Formulario vs Visual */}
      <Tabs value={simMode} onValueChange={(v) => setSimMode(v as 'form' | 'visual')}>
        <TabsList className="h-auto p-1 grid grid-cols-2 w-fit">
          <TabsTrigger value="form" className="gap-2 py-2 px-4">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Formulario
          </TabsTrigger>
          <TabsTrigger value="visual" className="gap-2 py-2 px-4">
            <Eye className="h-3.5 w-3.5" /> Vista cliente
          </TabsTrigger>
        </TabsList>

        {/* ── Modo Formulario ──────────────────────────────────────────── */}
        <TabsContent value="form" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Parámetros del préstamo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Monto (S/)</Label>
                  <NativeSelect value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))} className="h-8 text-xs">
                    {amounts.length === 0 && <NativeSelectOption value="0">Cargando...</NativeSelectOption>}
                    {amounts.map((a) => (
                      <NativeSelectOption key={a} value={String(a)}>S/ {a.toLocaleString()}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Plazo (días)</Label>
                  <NativeSelect value={String(termDays)} onChange={(e) => setTermDays(Number(e.target.value))} className="h-8 text-xs">
                    {terms.length === 0 && <NativeSelectOption value="0">—</NativeSelectOption>}
                    {terms.map((t) => (
                      <NativeSelectOption key={t} value={String(t)}>{t} días</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Cuotas</Label>
                  <NativeSelect value={String(installmentCount)} onChange={(e) => setInstallmentCount(Number(e.target.value))} className="h-8 text-xs">
                    {installments.length === 0 && <NativeSelectOption value="0">—</NativeSelectOption>}
                    {installments.map((i) => (
                      <NativeSelectOption key={i} value={String(i)}>{i} {i === 1 ? 'cuota' : 'cuotas'}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Credit Score</Label>
                  <Input type="number" value={creditScore} onChange={(e) => setCreditScore(Number(e.target.value))} className="h-8 text-xs" min={10} max={999} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Primer préstamo</Label>
                  <NativeSelect value={isFirstLoan ? 'true' : 'false'} onChange={(e) => setIsFirstLoan(e.target.value === 'true')} className="h-8 text-xs">
                    <NativeSelectOption value="true">Sí</NativeSelectOption>
                    <NativeSelectOption value="false">No</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSimulate} disabled={simulating} size="sm" className="gap-2">
                  {simulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Simular
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && <SimulationResult data={result} />}
        </TabsContent>

        {/* ── Modo Visual (como lo ve el cliente) ──────────────────────── */}
        <TabsContent value="visual" className="mt-4">
          {visualApi ? (
            <Card className="overflow-hidden" key={`${selectedAvailability}-${selectedFeeGroups}-${selectedPricingRules}`}>
              <CardHeader className="pb-2 bg-primary-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Así lo verá el cliente
                  </CardTitle>
                  <div className="flex gap-1.5">
                    {getStatusBadge(availabilityVersions, selectedAvailability)}
                    {getStatusBadge(feeGroupsVersions, selectedFeeGroups)}
                    {getStatusBadge(pricingRulesVersions, selectedPricingRules)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <LoanCalculatorProvider api={visualApi} theme={ADMIN_THEME}>
                  <LoanCalculator
                    submitLabel=""
                    dedicated={false}
                    detailMode="modal"
                  />
                </LoanCalculatorProvider>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Selecciona las 3 versiones de configuración para ver la calculadora visual.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Resultado de simulación ─────────────────────────────────────────────────

function SimulationResult({ data }: { data: any }) {
  const simulation = data.simulation;
  if (!simulation) return null;
  const { summary, schedule, fees } = simulation;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Resultado</CardTitle>
          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-mono">
            Total: S/ {summary.totalToPay.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryItem label="Capital" value={`S/ ${simulation.principal}`} />
          <SummaryItem label="Comisiones" value={`S/ ${summary.totalFeesResult.toFixed(2)}`} />
          <SummaryItem label="IGV (18%)" value={`S/ ${summary.totalIgvFromTotalFeesResult.toFixed(2)}`} />
          <SummaryItem label="Descuentos" value={`- S/ ${summary.totalDiscounts.toFixed(2)}`} muted />
        </div>

        {/* Fees */}
        {fees && Object.keys(fees).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Desglose de comisiones</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Cargo</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Original</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Desc.</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Final</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fees).map(([code, fee]: [string, any]) => (
                    <tr key={code} className="border-t">
                      <td className="px-3 py-1.5"><span className="font-medium">{fee.label}</span></td>
                      <td className="px-3 py-1.5 text-right font-mono">S/ {fee.originalAmount.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-destructive">
                        {fee.discountAmount > 0 ? `- ${fee.discountAmount.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-medium">S/ {fee.finalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cronograma */}
        {schedule && schedule.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Cronograma de pagos</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((s: any) => (
                    <tr key={s.installmentNo} className="border-t">
                      <td className="px-3 py-1.5 font-mono">{s.installmentNo}</td>
                      <td className="px-3 py-1.5">{s.dueDate}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-medium">S/ {s.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Versiones usadas */}
        {data.versionsUsed && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t">
            <span>Versiones:</span>
            <Badge variant="outline" className="text-[9px]">Disp: {data.versionsUsed.availability === 'ACTIVE' ? 'ACTIVE' : 'custom'}</Badge>
            <Badge variant="outline" className="text-[9px]">Fees: {data.versionsUsed.feeGroups === 'ACTIVE' ? 'ACTIVE' : 'custom'}</Badge>
            <Badge variant="outline" className="text-[9px]">Rules: {data.versionsUsed.pricingRules === 'ACTIVE' ? 'ACTIVE' : 'custom'}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-mono font-semibold ${muted ? 'text-muted-foreground' : ''}`}>{value}</p>
    </div>
  );
}
