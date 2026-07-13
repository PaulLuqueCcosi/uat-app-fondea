'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, Save, Loader2 } from 'lucide-react';
import { updateCapitalBaseAction } from '@/app/actions/portfolio.actions';

interface CapitalConfigClientProps {
  initialCapitalBase: number;
}

export function CapitalConfigClient({ initialCapitalBase }: CapitalConfigClientProps) {
  const [capitalBase, setCapitalBase] = useState<string>(initialCapitalBase > 0 ? String(initialCapitalBase) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const value = Number(capitalBase);
    if (!capitalBase || isNaN(value) || value <= 0) {
      setError('Ingresa un número positivo mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await updateCapitalBaseAction(value);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Capital Base de Cartera
          </CardTitle>
          <Badge variant="outline" className="font-mono">PEN</Badge>
        </div>
        <CardDescription className="text-xs">
          Capital total disponible para préstamos. Al cambiarlo se desactiva la configuración anterior y se crea una nueva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="capitalBase" className="text-sm font-medium">
              Capital base actual
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">S/</span>
              <Input
                id="capitalBase"
                type="number"
                min={1}
                step="0.01"
                value={capitalBase}
                onChange={(e) => {
                  setCapitalBase(e.target.value);
                  setSuccess(false);
                  setError(null);
                }}
                placeholder="Ej: 500000"
                className="h-10 font-mono"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-error-600 bg-error-50 px-3 py-2 rounded-md">{error}</p>
          )}
          {success && (
            <p className="text-xs text-success-600 bg-success-50 px-3 py-2 rounded-md">
              Capital base actualizado correctamente.
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={loading} size="sm">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
