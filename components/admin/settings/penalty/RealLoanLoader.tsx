'use client';

import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loadRealLoanAction } from '@/app/actions/admin-penalty.actions';
import { moraBaseAmounts, type RealInstallment, type RealLoan } from '@/modules/admin/mora-real-loan';
import { conceptLabel } from '@/modules/shared/charge-concepts';

interface Props {
  /** Se llama al elegir una cuota: el simulador toma de ahí los montos, el período y el capital. */
  onPick: (installment: RealInstallment, loan: RealLoan) => void;
  /** Cuota elegida en este momento, para marcarla. */
  selectedNo: number | null;
  /** La configuración simulada calcula la mora sobre montos con IGV: las tarjetas muestran esa misma base. */
  includeIgv: boolean;
}

const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Arma un préstamo con la calculadora y sus tarifas vigentes y deja elegir una de sus cuotas como base de la
 * simulación. Así la mora se prueba con montos reales (interés, gastos y tarifa por cuota) y no con números inventados.
 */
export function RealLoanLoader({ onPick, selectedNo, includeIgv }: Props) {
  const [amount, setAmount] = useState('500');
  const [termDays, setTermDays] = useState('30');
  const [count, setCount] = useState('3');
  const [score, setScore] = useState('450');
  const [firstLoan, setFirstLoan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loan, setLoan] = useState<RealLoan | null>(null);

  async function calculate() {
    setError(null);
    setLoading(true);
    const response = await loadRealLoanAction({
      amount: Number(amount),
      termDays: Number(termDays),
      installmentCount: Number(count),
      creditScore: Number(score),
      isFirstLoan: firstLoan,
    });
    setLoading(false);
    if (response.ok) {
      setLoan(response.data);
    } else {
      setLoan(null);
      setError(response.message);
    }
  }

  return (
    <details className="rounded-lg border bg-muted/30 p-3" open>
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Database className="h-4 w-4 text-primary" aria-hidden="true" /> Usar datos reales de la calculadora
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Calcula un préstamo con las tarifas que están activas hoy y elige una cuota: sus montos por categoría, su período y su
        capital llenan el simulador. Los montos van {includeIgv ? 'con' : 'sin'} IGV, igual que la base de mora de esta
        configuración.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field id="real-amount" label="Monto (S/)" value={amount} onChange={setAmount} step="1" />
        <Field id="real-term" label="Plazo (días)" value={termDays} onChange={setTermDays} step="1" />
        <Field id="real-count" label="Cuotas" value={count} onChange={setCount} step="1" />
        <Field id="real-score" label="Puntaje (10 a 999)" value={score} onChange={setScore} step="1" />
        <label className="flex items-end gap-2 pb-2 text-xs">
          <input type="checkbox" checked={firstLoan} onChange={(e) => setFirstLoan(e.target.checked)} />
          Primer préstamo
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={calculate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Calcular cuotas
        </Button>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {loan && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">Elige la cuota que entra en mora:</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cuotas del préstamo calculado">
            {loan.installments.map((inst) => {
              const base = moraBaseAmounts(inst, includeIgv);
              return (
              <button
                key={inst.no}
                type="button"
                onClick={() => onPick(inst, loan)}
                aria-pressed={selectedNo === inst.no}
                data-testid={`real-cuota-${inst.no}`}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-muted ${
                  selectedNo === inst.no ? 'border-primary bg-primary/10' : 'bg-background'
                }`}
              >
                <span className="block font-semibold">Cuota {inst.no} · {inst.dueDate}</span>
                <span className="block font-mono text-muted-foreground">
                  Capital S/ {money.format(inst.principal)} · {conceptLabel('INTERES_COMPENSATORIO')} S/ {money.format(base.INTERES_COMPENSATORIO)} ·
                  Gastos S/ {money.format(base.GASTOS)} · Tarifa S/ {money.format(base.TARIFA)}
                  {includeIgv ? ' (con IGV)' : ''}
                </span>
              </button>
              );
            })}
          </div>
        </div>
      )}
    </details>
  );
}

function Field({ id, label, value, onChange, step }: { id: string; label: string; value: string; onChange: (v: string) => void; step: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">{label}</Label>
      <Input id={id} type="number" min={1} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 font-mono" />
    </div>
  );
}
