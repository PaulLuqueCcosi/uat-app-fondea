'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlaskConical, Loader2, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import type { ScorecardConfig, EvaluationOutcome } from '@/modules/admin/scoring';
import { simulateUserScore, recalculateUserScore } from '@/app/admin/scoring/actions';

interface Props {
  configs: ScorecardConfig[];
}

export function SimulateTab({ configs }: Props) {
  const [userId, setUserId] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!userId.trim()) { setError('Ingresa el ID del usuario'); return; }
    if (!selectedConfigId) { setError('Selecciona una configuración para probar'); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    const outcome = await simulateUserScore(userId.trim(), selectedConfigId);
    setLoading(false);

    if (outcome) {
      setResult(outcome);
      if (!outcome.success) setError(outcome.errorMessage || 'Error desconocido');
    } else {
      setError('Error de conexión con el servidor');
    }
  };

  const handleRecalculate = async () => {
    if (!userId.trim()) { setError('Ingresa el ID del usuario'); return; }

    if (!confirm('Esto recalculará el score REAL del usuario con la configuración ACTIVA. ¿Continuar?')) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const outcome = await recalculateUserScore(userId.trim());
    setLoading(false);

    if (outcome) {
      setResult(outcome);
      if (!outcome.success) setError(outcome.errorMessage || 'Error desconocido');
    } else {
      setError('Error de conexión con el servidor');
    }
  };

  const draftConfigs = configs.filter(c => c.status === 'DRAFT');
  const activeConfig = configs.find(c => c.status === 'ACTIVE');

  const scoreLevelConfig: Record<string, { color: string; label: string }> = {
    EXCELENTE: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Excelente' },
    BUENO: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Bueno' },
    REGULAR: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Regular' },
    BAJO: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Bajo' },
    MUY_BAJO: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Muy bajo' },
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Simular:</strong> Calcula el score con una configuración específica SIN guardarlo. Ideal para probar borradores.
          <br />
          <strong>Recalcular:</strong> Calcula y GUARDA el score real usando la configuración activa.
        </AlertDescription>
      </Alert>

      {/* Formulario */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Probar scoring
          </CardTitle>
          <CardDescription>
            Ingresa el ID de un usuario para ver cómo quedaría su score con una configuración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>ID del usuario</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="UUID del usuario"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Configuración a probar</Label>
              <Select value={selectedConfigId} onValueChange={(v) => v && setSelectedConfigId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar versión..." />
                </SelectTrigger>
                <SelectContent>
                  {activeConfig && (
                    <SelectItem value={activeConfig.id}>
                      ✅ v{activeConfig.version} — {activeConfig.name} (activa)
                    </SelectItem>
                  )}
                  {draftConfigs.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      📝 v{c.version} — {c.name} (borrador)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSimulate} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FlaskConical className="h-4 w-4 mr-1.5" />}
                Simular
              </Button>
              <Button variant="outline" onClick={handleRecalculate} disabled={loading} title="Recalcula con la config ACTIVA y guarda el score">
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Recalcular
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && result.success && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Resultado de la evaluación
              <Badge className={scoreLevelConfig[result.scoreLevel || '']?.color || 'bg-gray-100'}>
                {scoreLevelConfig[result.scoreLevel || '']?.label || result.scoreLevel}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-1">
                <p className="text-4xl font-bold text-primary">{result.newScore}</p>
                <p className="text-xs text-muted-foreground">Score calculado</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-semibold text-muted-foreground">
                  {result.previousScore ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">Score anterior</p>
              </div>
              <div className="text-center space-y-1">
                <p className={`text-2xl font-semibold flex items-center justify-center gap-1 ${
                  (result.delta ?? 0) > 0 ? 'text-green-600' : (result.delta ?? 0) < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {(result.delta ?? 0) > 0 && <TrendingUp className="h-5 w-5" />}
                  {(result.delta ?? 0) < 0 && <TrendingDown className="h-5 w-5" />}
                  {result.delta === 0 && <Minus className="h-5 w-5" />}
                  {(result.delta ?? 0) > 0 ? '+' : ''}{result.delta ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Diferencia</p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium">v{result.configVersion}</p>
                <p className="text-xs text-muted-foreground">Versión usada</p>
              </div>
            </div>

            {result.evaluationId && (
              <p className="text-[10px] text-muted-foreground mt-4 text-center">
                ID de evaluación: {result.evaluationId}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
