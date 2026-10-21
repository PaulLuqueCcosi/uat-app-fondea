'use client';

import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { simulatePenaltyAction } from '@/app/actions/admin-penalty.actions';
import type {
  SavePenaltyConfigRequest,
  SimulatePenaltyResponse,
} from '@/modules/admin/admin-penalty.types';
import { MATRIX_CONCEPTS, conceptLabel, type ChargeConcept } from '@/modules/shared/charge-concepts';
import { penaltyErrorMessage } from './penalty-errors';

/** De dónde sale la configuración a simular. */
export type SimulationSource =
  | { kind: 'draft'; config: SavePenaltyConfigRequest }
  | { kind: 'saved'; configId: string }
  | { kind: 'unavailable'; reason: string };

interface Props {
  source: SimulationSource;
}

/** Conceptos de la cuota que se pueden ingresar (el moratorio se calcula sobre el capital vencido). */
const AMOUNT_CONCEPTS = MATRIX_CONCEPTS.filter((c) => c !== 'INTERES_MORATORIO');

const MAX_SIMULATED_DAYS = 366;

const SAMPLE_AMOUNTS: Partial<Record<ChargeConcept, string>> = {
  INTERES_COMPENSATORIO: '17.50',
  GASTOS: '5.83',
  TARIFA: '0',
};

const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseNonNegative(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function PenaltySimulatorPanel({ source }: Props) {
  const [amounts, setAmounts] = useState<Record<string, string>>({ ...SAMPLE_AMOUNTS });
  const [periodDays, setPeriodDays] = useState('10');
  const [overdueCapital, setOverdueCapital] = useState('166.67');
  const [fromDay, setFromDay] = useState('1');
  const [toDay, setToDay] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulatePenaltyResponse | null>(null);

  async function run() {
    setError(null);
    if (source.kind === 'unavailable') {
      setError(source.reason);
      return;
    }

    const conceptAmounts: Partial<Record<ChargeConcept, number>> = {};
    for (const concept of AMOUNT_CONCEPTS) {
      const raw = amounts[concept] ?? '';
      if (raw.trim() === '') continue; // vacío = el concepto no existe en la cuota
      const value = parseNonNegative(raw);
      if (value === null) {
        setError(`${conceptLabel(concept)}: ingresa un monto válido (0 o mayor)`);
        return;
      }
      conceptAmounts[concept] = value;
    }

    const period = Number(periodDays);
    if (!Number.isInteger(period) || period < 1) {
      setError('Los días del período deben ser un número entero de 1 o más');
      return;
    }
    const capital = parseNonNegative(overdueCapital);
    if (capital === null) {
      setError('El capital vencido debe ser 0 o mayor');
      return;
    }
    const from = Number(fromDay);
    const to = Number(toDay);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
      setError('El rango de días debe ser de enteros, empezar en 1 o más y terminar en un día igual o posterior');
      return;
    }
    if (to - from + 1 > MAX_SIMULATED_DAYS) {
      setError(`Simula como máximo ${MAX_SIMULATED_DAYS} días a la vez`);
      return;
    }

    setLoading(true);
    const response = await simulatePenaltyAction({
      ...(source.kind === 'draft' ? { config: source.config } : { configId: source.configId }),
      conceptAmounts,
      periodDays: period,
      overdueCapital: capital,
      fromDay: from,
      toDay: to,
    });
    setLoading(false);

    if (response.ok) {
      setResult(response.data);
    } else {
      setResult(null);
      setError(penaltyErrorMessage(response.error, 'No se pudo simular'));
    }
  }

  const dayTotal = (charges: Partial<Record<ChargeConcept, number>>) =>
    Object.values(charges).reduce<number>((sum, v) => sum + (v ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" aria-hidden="true" /> Simulador de mora
        </CardTitle>
        <CardDescription>
          Ingresa una cuota de ejemplo y mira cuánto se cobra por día de atraso en cada concepto.
          {source.kind === 'draft' && ' Usa la configuración que estás editando, sin guardarla.'}
          {source.kind === 'saved' && ' Usa la configuración activa.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {source.kind === 'unavailable' && (
          <p className="text-sm text-muted-foreground">{source.reason}</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {AMOUNT_CONCEPTS.map((concept) => (
            <div key={concept} className="space-y-1">
              <Label htmlFor={`sim-${concept}`} className="text-[11px] text-muted-foreground">
                {conceptLabel(concept)} de la cuota (S/)
              </Label>
              <Input
                id={`sim-${concept}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amounts[concept] ?? ''}
                onChange={(e) => setAmounts({ ...amounts, [concept]: e.target.value })}
                placeholder="0"
                className="h-9 font-mono"
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="sim-period" className="text-[11px] text-muted-foreground">Días del período de la cuota</Label>
            <Input
              id="sim-period"
              type="number"
              min={1}
              step={1}
              value={periodDays}
              onChange={(e) => setPeriodDays(e.target.value)}
              className="h-9 font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sim-capital" className="text-[11px] text-muted-foreground">Capital vencido (S/)</Label>
            <Input
              id="sim-capital"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={overdueCapital}
              onChange={(e) => setOverdueCapital(e.target.value)}
              className="h-9 font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sim-from" className="text-[11px] text-muted-foreground">Desde el día de mora</Label>
            <Input
              id="sim-from"
              type="number"
              min={1}
              step={1}
              value={fromDay}
              onChange={(e) => setFromDay(e.target.value)}
              className="h-9 font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sim-to" className="text-[11px] text-muted-foreground">Hasta el día de mora</Label>
            <Input
              id="sim-to"
              type="number"
              min={1}
              step={1}
              value={toDay}
              onChange={(e) => setToDay(e.target.value)}
              className="h-9 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-1.5" onClick={run} disabled={loading || source.kind === 'unavailable'}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            Simular
          </Button>
          <p className="text-[11px] text-muted-foreground">Un monto vacío significa que la cuota no tiene ese concepto.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-2">
            {result.perDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">El simulador no devolvió días para ese rango.</p>
            ) : (
              <div className="max-h-96 overflow-auto rounded-lg border">
                <table className="w-full min-w-[640px] text-xs">
                  <caption className="sr-only">Cargo de mora por día y por concepto</caption>
                  <thead className="sticky top-0 bg-muted text-right">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Día de mora</th>
                      {MATRIX_CONCEPTS.map((c) => (
                        <th key={c} scope="col" className="px-3 py-2 font-medium">{conceptLabel(c)}</th>
                      ))}
                      <th scope="col" className="px-3 py-2 font-medium">Total del día</th>
                    </tr>
                  </thead>
                  <tbody className="text-right font-mono">
                    {result.perDay.map((d) => (
                      <tr key={d.day} className="border-t">
                        <th scope="row" className="px-3 py-1.5 text-left font-normal">{d.day}</th>
                        {MATRIX_CONCEPTS.map((c) => (
                          <td key={c} className="px-3 py-1.5">{money.format(d.charges[c] ?? 0)}</td>
                        ))}
                        <td className="px-3 py-1.5 font-semibold">{money.format(dayTotal(d.charges))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 bg-muted/40 text-right font-mono font-semibold">
                    <tr>
                      <th scope="row" className="px-3 py-2 text-left">Total del rango</th>
                      {MATRIX_CONCEPTS.map((c) => (
                        <td key={c} className="px-3 py-2">{money.format(result.totals[c] ?? 0)}</td>
                      ))}
                      <td className="px-3 py-2">{money.format(dayTotal(result.totals))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
