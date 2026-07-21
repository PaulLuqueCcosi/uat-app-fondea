'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
    if (!userId.trim()) {
      setError('Ingresa un User ID');
      return;
    }
    if (!selectedConfigId) {
      setError('Selecciona una configuración');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const outcome = await simulateUserScore(userId.trim(), selectedConfigId);
    setLoading(false);

    if (outcome) {
      setResult(outcome);
      if (!outcome.success) {
        setError(outcome.errorMessage || 'Error desconocido');
      }
    } else {
      setError('Error de conexión con el servidor');
    }
  };

  const handleRecalculate = async () => {
    if (!userId.trim()) {
      setError('Ingresa un User ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const outcome = await recalculateUserScore(userId.trim());
    setLoading(false);

    if (outcome) {
      setResult(outcome);
      if (!outcome.success) {
        setError(outcome.errorMessage || 'Error desconocido');
      }
    } else {
      setError('Error de conexión con el servidor');
    }
  };

  const draftConfigs = configs.filter(c => c.status === 'DRAFT');
  const activeConfig = configs.find(c => c.status === 'ACTIVE');

  const scoreLevelColor = (level: string | null) => {
    switch (level) {
      case 'EXCELENTE': return 'bg-green-100 text-green-800';
      case 'BUENO': return 'bg-blue-100 text-blue-800';
      case 'REGULAR': return 'bg-amber-100 text-amber-800';
      case 'BAJO': return 'bg-orange-100 text-orange-800';
      case 'MUY_BAJO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Simular score de un usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>User ID</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="UUID del usuario"
              />
            </div>
            <div>
              <Label>Configuración</Label>
              <Select value={selectedConfigId} onValueChange={(v) => v && setSelectedConfigId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar config" />
                </SelectTrigger>
                <SelectContent>
                  {activeConfig && (
                    <SelectItem value={activeConfig.id}>
                      v{activeConfig.version} — {activeConfig.name} (ACTIVA)
                    </SelectItem>
                  )}
                  {draftConfigs.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      v{c.version} — {c.name} (DRAFT)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSimulate} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                Simular
              </Button>
              <Button variant="outline" onClick={handleRecalculate} disabled={loading} title="Recalcula con la config ACTIVA y guarda el resultado">
                Recalcular (real)
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && result.success && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              Resultado
              <Badge className={scoreLevelColor(result.scoreLevel)}>{result.scoreLevel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{result.newScore}</p>
                <p className="text-xs text-muted-foreground">Score nuevo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-muted-foreground">
                  {result.previousScore ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">Score previo</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-semibold flex items-center justify-center gap-1 ${
                  (result.delta ?? 0) > 0 ? 'text-green-600' : (result.delta ?? 0) < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {(result.delta ?? 0) > 0 && <TrendingUp className="h-4 w-4" />}
                  {(result.delta ?? 0) < 0 && <TrendingDown className="h-4 w-4" />}
                  {(result.delta ?? 0) === 0 && <Minus className="h-4 w-4" />}
                  {result.delta ?? 0 > 0 ? '+' : ''}{result.delta}
                </p>
                <p className="text-xs text-muted-foreground">Delta</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">v{result.configVersion}</p>
                <p className="text-xs text-muted-foreground">Config usada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
