'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Loader2, Play } from 'lucide-react';
import { simulateEvaluationAction } from '@/app/actions/admin-evaluation-rules.actions';
import type { EvaluationResponse, RuleSetVersionResponse } from '@/modules/admin/admin-evaluation-rules.service';

const SAMPLE_PROFILE = JSON.stringify({
  kyc: { dni: "12345678", firstName: "Juan", firstLastName: "Pérez", birthDate: "1990-05-15", verificationCode: "1" },
  labor: { situation: "EMPLEADO_DEPENDIENTE", details: { industry: "TECNOLOGIA", yearsOfActivity: 5, businessRuc: null }, income: { monthlyIncome: 3500, incomeReceiptMethod: "CUENTA_BANCARIA", hasAdditionalIncome: false, additionalIncomes: [] } },
  economic: { loanPurpose: "NEGOCIO", monthlyExpenses: 1200, hasDebts: false, debts: [], hasProperty: true, hasVehicle: false, hasServices: true, educationLevel: "UNIVERSITARIA" },
  references: { familyReference: { name: "María Pérez", phone: "999111222", relationship: "MADRE" }, nonFamilyReference: { name: "Carlos López", phone: "999333444", relationship: "COLEGA", yearsKnown: 3 } },
  address: { address_type: "GOOGLE", region: "Lima", province: "Lima", district: "Miraflores" },
  bankAccount: { bank_name: "BCP", account_type: "AHORROS", cci_masked: "002-***-123", account_number_masked: "***123" }
}, null, 2);

const SAMPLE_INTENTION = JSON.stringify({
  userIntentionId: "00000000-0000-0000-0000-000000000001",
  productId: "550e8400-e29b-41d4-a716-446655440000",
  amount: 2000,
  termDays: 60,
  installmentCount: 3,
  isFirstLoan: true
}, null, 2);

interface SimulationPanelProps {
  versions: RuleSetVersionResponse[];
}

export function SimulationPanel({ versions }: SimulationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('active');
  const [profileJson, setProfileJson] = useState(SAMPLE_PROFILE);
  const [intentionJson, setIntentionJson] = useState(SAMPLE_INTENTION);
  const [score, setScore] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setError(null);
    setResult(null);
    setSimulating(true);

    try {
      const res = await simulateEvaluationAction({
        rulesJson: null, // Uses active version in backend
        profileSnapshot: profileJson,
        userIntentionSnapshot: intentionJson,
        currentScore: score.trim() ? Number(score) : null,
      });

      if (res.ok && res.data) {
        setResult(res.data);
      } else {
        setError(res.error ?? 'Error en la simulación');
      }
    } catch (e: any) {
      setError(e.message ?? 'Error inesperado');
    }
    setSimulating(false);
  };

  const loadSampleData = () => {
    setProfileJson(SAMPLE_PROFILE);
    setIntentionJson(SAMPLE_INTENTION);
    setScore('650');
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
        <CardContent className="space-y-4 pt-0">
          <p className="text-xs text-muted-foreground">
            Prueba las reglas activas con datos de ejemplo para verificar que la evaluación funciona correctamente.
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              Cargar datos de ejemplo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Profile Snapshot</Label>
              <Textarea
                rows={10}
                value={profileJson}
                onChange={(e) => setProfileJson(e.target.value)}
                className="font-mono text-[11px] leading-tight"
                placeholder="JSON del perfil completo..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">User Intention Snapshot</Label>
              <Textarea
                rows={10}
                value={intentionJson}
                onChange={(e) => setIntentionJson(e.target.value)}
                className="font-mono text-[11px] leading-tight"
                placeholder="JSON de la intención..."
              />
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="w-40 space-y-1">
              <Label className="text-xs font-medium">Score actual</Label>
              <Input
                type="number"
                placeholder="Ej: 650"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="h-8"
              />
            </div>
            <Button onClick={handleSimulate} disabled={simulating} size="sm">
              {simulating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Ejecutar Simulación
            </Button>
          </div>

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

function SimulationResult({ result }: { result: EvaluationResponse }) {
  const decisionConfig: Record<string, { bg: string; text: string; label: string }> = {
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Aprobado' },
    MANUAL_REVIEW: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Revisión Manual' },
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

      {result.errors.length > 0 && (
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

      {result.appliedFactors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Factores de scoring aplicados:</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-1.5">Regla</th>
                  <th className="text-left px-3 py-1.5">Categoría</th>
                  <th className="text-right px-3 py-1.5">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.appliedFactors.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{f.label}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{f.category}</td>
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
