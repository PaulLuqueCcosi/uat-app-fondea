'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp, Loader2, Play } from 'lucide-react';
import { simulateEvaluationAction } from '@/app/actions/admin-evaluation-rules.actions';
import type { EvaluationResponse, RuleSetVersionResponse } from '@/modules/admin/admin-evaluation-rules.service';
import { YEARS_OF_ACTIVITY_OPTIONS } from '@/lib/constants';

interface SimulationPanelProps {
  versions: RuleSetVersionResponse[];
}

export function SimulationPanel({ versions }: SimulationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Formulario intuitivo
  const [age, setAge] = useState('30');
  const [dni, setDni] = useState('12345678');
  const [situation, setSituation] = useState('EMPLEADO_DEPENDIENTE');
  const [yearsOfActivity, setYearsOfActivity] = useState('MAS_DE_3_ANIOS');
  const [monthlyIncome, setMonthlyIncome] = useState('3500');
  const [incomeMethod, setIncomeMethod] = useState('CUENTA_BANCARIA');
  const [hasAdditionalIncome, setHasAdditionalIncome] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState('1200');
  const [hasDebts, setHasDebts] = useState(false);
  const [totalDebts, setTotalDebts] = useState('0');
  const [hasProperty, setHasProperty] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [hasServices, setHasServices] = useState(true);
  const [educationLevel, setEducationLevel] = useState('UNIVERSITARIA');
  const [loanPurpose, setLoanPurpose] = useState('NEGOCIO');
  const [amount, setAmount] = useState('2000');
  const [termDays, setTermDays] = useState('60');
  const [installments, setInstallments] = useState('3');
  const [isFirstLoan, setIsFirstLoan] = useState(true);
  const [currentScore, setCurrentScore] = useState('');

  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildSnapshots = () => {
    const birthYear = new Date().getFullYear() - Number(age);
    const profileSnapshot = JSON.stringify({
      kyc: {
        dni,
        firstName: 'Simulación',
        firstLastName: 'Test',
        birthDate: `${birthYear}-01-15`,
        verificationCode: '1',
      },
      labor: {
        situation,
        details: { industry: 'TECNOLOGIA', yearsOfActivity, businessRuc: null },
        income: { monthlyIncome: Number(monthlyIncome), incomeReceiptMethod: incomeMethod, hasAdditionalIncome, additionalIncomes: [] },
      },
      economic: {
        loanPurpose,
        monthlyExpenses: Number(monthlyExpenses),
        hasDebts,
        debts: hasDebts ? [{ creditor: 'Banco', amount: Number(totalDebts), type: 'personal' }] : [],
        hasProperty,
        hasVehicle,
        hasServices,
        educationLevel,
      },
      references: {
        familyReference: { name: 'María Test', phone: '999111222', relationship: 'MADRE' },
        nonFamilyReference: { name: 'Carlos Test', phone: '999333444', relationship: 'COLEGA', yearsKnown: 3 },
      },
      address: { address_type: 'GOOGLE', region: 'Lima', province: 'Lima', district: 'Miraflores' },
      bankAccount: { bank_name: 'BCP', account_type: 'AHORROS', cci_masked: '002-***-123', account_number_masked: '***123' },
    });

    const userIntentionSnapshot = JSON.stringify({
      userIntentionId: '00000000-0000-0000-0000-000000000001',
      productId: '550e8400-e29b-41d4-a716-446655440000',
      amount: Number(amount),
      termDays: Number(termDays),
      installmentCount: Number(installments),
      isFirstLoan,
    });

    return { profileSnapshot, userIntentionSnapshot };
  };

  const handleSimulate = async () => {
    setError(null);
    setResult(null);
    setSimulating(true);

    const { profileSnapshot, userIntentionSnapshot } = buildSnapshots();

    const res = await simulateEvaluationAction({
      rulesJson: null,
      profileSnapshot,
      userIntentionSnapshot,
      currentScore: currentScore.trim() ? Number(currentScore) : null,
    });

    if (res.ok && res.data) {
      setResult(res.data);
    } else {
      setError(res.error ?? 'Error en la simulación');
    }
    setSimulating(false);
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-3" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Simulador de Evaluación
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5 pt-0">
          <p className="text-xs text-muted-foreground">
            Configura un perfil ficticio y prueba cómo las reglas activas lo evalúan.
          </p>

          {/* ─── Datos del solicitante ─────────────────────────────── */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identidad</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Edad" value={age} onChange={setAge} type="number" />
              <Field label="DNI" value={dni} onChange={setDni} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Situación laboral</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SelectField label="Situación" value={situation} onChange={setSituation} options={[
                { value: 'EMPLEADO_DEPENDIENTE', label: 'Empleado' },
                { value: 'INDEPENDIENTE', label: 'Independiente' },
                { value: 'EMPRESARIO', label: 'Empresario' },
                { value: 'FREELANCE', label: 'Freelance' },
              ]} />
              <SelectField label="Años de actividad" value={yearsOfActivity} onChange={setYearsOfActivity} options={[...YEARS_OF_ACTIVITY_OPTIONS]} />
              <Field label="Ingreso mensual (S/)" value={monthlyIncome} onChange={setMonthlyIncome} type="number" />
              <SelectField label="Método de cobro" value={incomeMethod} onChange={setIncomeMethod} options={[
                { value: 'CUENTA_BANCARIA', label: 'Cuenta bancaria' },
                { value: 'EFECTIVO', label: 'Efectivo' },
                { value: 'BILLETERA_DIGITAL', label: 'Billetera digital' },
              ]} />
            </div>
            <SwitchField label="Tiene ingresos adicionales" checked={hasAdditionalIncome} onChange={setHasAdditionalIncome} />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Economía</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Gastos mensuales (S/)" value={monthlyExpenses} onChange={setMonthlyExpenses} type="number" />
              <SelectField label="Propósito" value={loanPurpose} onChange={setLoanPurpose} options={[
                { value: 'NEGOCIO', label: 'Negocio' },
                { value: 'EDUCACION', label: 'Educación' },
                { value: 'SALUD', label: 'Salud' },
                { value: 'DEUDAS', label: 'Pagar deudas' },
                { value: 'HOGAR', label: 'Hogar' },
                { value: 'OTRO', label: 'Otro' },
              ]} />
              <SelectField label="Nivel educativo" value={educationLevel} onChange={setEducationLevel} options={[
                { value: 'PRIMARIA', label: 'Primaria' },
                { value: 'SECUNDARIA', label: 'Secundaria' },
                { value: 'TECNICA', label: 'Técnica' },
                { value: 'UNIVERSITARIA', label: 'Universitaria' },
                { value: 'POSGRADO', label: 'Posgrado' },
              ]} />
            </div>
            <div className="flex flex-wrap gap-4">
              <SwitchField label="Tiene deudas" checked={hasDebts} onChange={setHasDebts} />
              {hasDebts && <Field label="Total deudas (S/)" value={totalDebts} onChange={setTotalDebts} type="number" />}
              <SwitchField label="Tiene propiedad" checked={hasProperty} onChange={setHasProperty} />
              <SwitchField label="Tiene vehículo" checked={hasVehicle} onChange={setHasVehicle} />
              <SwitchField label="Tiene servicios" checked={hasServices} onChange={setHasServices} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Préstamo solicitado</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Field label="Monto (S/)" value={amount} onChange={setAmount} type="number" />
              <Field label="Plazo (días)" value={termDays} onChange={setTermDays} type="number" />
              <Field label="Cuotas" value={installments} onChange={setInstallments} type="number" />
              <Field label="Score actual" value={currentScore} onChange={setCurrentScore} type="number" placeholder="Vacío = sin historial" />
              <div className="flex items-end">
                <SwitchField label="Primer préstamo" checked={isFirstLoan} onChange={setIsFirstLoan} />
              </div>
            </div>
          </div>

          <Separator />

          <Button onClick={handleSimulate} disabled={simulating} size="sm">
            {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
            Ejecutar Simulación
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {result && <SimulationResult result={result} />}
        </CardContent>
      )}
    </Card>
  );
}

// ── Sub-componentes de formulario ─────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-xs"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SwitchField({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
      <Label className="text-[10px] cursor-pointer" onClick={() => onChange(!checked)}>{label}</Label>
    </div>
  );
}

// ── Resultado ─────────────────────────────────────────────────────────────────

function SimulationResult({ result }: { result: EvaluationResponse }) {
  const decisionConfig: Record<string, { bg: string; text: string; label: string }> = {
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Aprobado' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rechazado' },
  };
  const dc = decisionConfig[result.decision] ?? { bg: 'bg-muted', text: 'text-foreground', label: result.decision };

  return (
    <div className="space-y-4 mt-2">
      <Separator />

      <div className={`rounded-lg p-4 ${dc.bg} border`}>
        <div className="flex items-center gap-3">
          <Badge className={`${dc.bg} ${dc.text} border text-xs`}>{dc.label}</Badge>
          {result.finalScore !== null && (
            <span className="text-sm">
              Score: <span className="font-bold">{result.finalScore}</span>/100
              {result.baseScore !== null && (
                <span className="text-muted-foreground ml-1 text-xs">(base: {result.baseScore})</span>
              )}
            </span>
          )}
        </div>
        {result.detail && (
          <p className="text-xs mt-2 text-muted-foreground">{result.detail}</p>
        )}
      </div>

      {result.errors && result.errors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-destructive">Reglas eliminatorias fallidas:</p>
          {result.errors.map((err, i) => (
            <div key={i} className="text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
              <span className="font-medium">{err.label ?? err.ruleId}</span>
              {err.message && <span className="text-muted-foreground"> — {err.message}</span>}
            </div>
          ))}
        </div>
      )}

      {result.appliedFactors && result.appliedFactors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Factores de scoring aplicados:</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-1.5">Regla</th>
                  <th className="text-right px-3 py-1.5">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.appliedFactors.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{f.label}</td>
                    <td className={`px-3 py-1.5 text-right font-mono font-medium ${f.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {f.points > 0 ? '+' : ''}{f.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
