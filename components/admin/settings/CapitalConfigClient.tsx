'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Wallet, Plus, RotateCcw, Loader2, ArrowUpCircle, ArrowDownCircle,
  RefreshCw, Wrench, History,
} from 'lucide-react';
import {
  getFundStatusAction, registerFundMovementAction, getFundMovementsAction,
  type FundStatus, type FundMovement, type FundMovementType,
} from '@/app/actions/portfolio.actions';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  CAPITAL_INJECTION: { label: 'Inyección de capital', icon: ArrowUpCircle, color: 'text-success-600' },
  PROFIT_WITHDRAWAL: { label: 'Retiro de utilidades', icon: ArrowDownCircle, color: 'text-error-600' },
  BANK_SYNC: { label: 'Sincronización con banco', icon: RefreshCw, color: 'text-primary' },
  MANUAL_ADJUSTMENT: { label: 'Ajuste manual', icon: Wrench, color: 'text-warning-600' },
  LOAN_DISBURSEMENT: { label: 'Desembolso préstamo', icon: ArrowDownCircle, color: 'text-error-500' },
  LOAN_REPAYMENT: { label: 'Pago cuota recibido', icon: ArrowUpCircle, color: 'text-success-500' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CapitalConfigClient() {
  const [status, setStatus] = useState<FundStatus | null>(null);
  const [movements, setMovements] = useState<FundMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<FundMovementType>('CAPITAL_INJECTION');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Confirmation dialog
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([
        getFundStatusAction(),
        getFundMovementsAction(20),
      ]);
      setStatus(s);
      setMovements(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del fondo');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    const value = Number(amount);
    if (!amount || isNaN(value) || value === 0) {
      setSubmitError('Ingresa un monto válido distinto de 0');
      return;
    }

    if (!description.trim()) {
      setSubmitError('La descripción es obligatoria para auditoría');
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirm(true);
  }

  async function confirmMovement() {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitError(null);

    try {
      await registerFundMovementAction(type, Number(amount), description.trim(), reference.trim() || undefined);
      setSubmitSuccess(true);
      setAmount('');
      setDescription('');
      setReference('');
      // Refrescar data
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  }

  const amountNum = Number(amount) || 0;
  const isNegativeOp = type === 'PROFIT_WITHDRAWAL';

  if (loading && !status) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  if (error && !status) {
    return (
      <Card className="max-w-lg">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-sm text-error-600">{error}</p>
          <p className="text-xs text-muted-foreground">
            Es posible que no exista un fondo configurado. Contacta al desarrollador.
          </p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ═══ ESTADO DEL FONDO ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Estado del Fondo
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={fetchData} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Capital total</p>
                <p className="text-lg font-bold">{formatCurrency(status.capital_base)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capital disponible</p>
                <p className="text-lg font-bold text-success-600">{formatCurrency(status.available_capital)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colocado (en préstamos)</p>
                <p className="text-sm font-medium">{formatCurrency(status.total_deployed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilización</p>
                <p className="text-sm font-medium">{status.utilization_rate}%</p>
              </div>
              {status.last_updated_by && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Última actualización: {status.last_sync_at ? formatDate(status.last_sync_at) : '—'} por {status.last_updated_by}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-warning-600">No hay fondo configurado. Registra una inyección de capital para iniciar.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══ REGISTRAR MOVIMIENTO ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Registrar Movimiento
          </CardTitle>
          <CardDescription className="text-xs">
            Todo cambio queda en auditoría con fecha, monto y quién lo ejecutó.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitClick} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo de movimiento</Label>
                <Select value={type} onValueChange={(v) => setType(v as FundMovementType)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAPITAL_INJECTION">💰 Inyección de capital</SelectItem>
                    <SelectItem value="PROFIT_WITHDRAWAL">📤 Retiro de utilidades</SelectItem>
                    <SelectItem value="BANK_SYNC">🔄 Sincronización con banco</SelectItem>
                    <SelectItem value="MANUAL_ADJUSTMENT">🔧 Ajuste manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">
                  Monto (S/) {isNegativeOp && <span className="text-error-500 text-xs">— sale del fondo</span>}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setSubmitSuccess(false); setSubmitError(null); }}
                  placeholder={isNegativeOp ? 'Ej: 5000 (se restará)' : 'Ej: 50000'}
                  className="h-9 font-mono"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Descripción (obligatoria)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Depósito socio Juan — transferencia BCP"
                className="h-9"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Referencia externa (opcional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej: Nro operación 00452178"
                className="h-9"
                disabled={submitting}
              />
            </div>

            {submitError && (
              <p className="text-xs text-error-600 bg-error-50 px-3 py-2 rounded-md">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-xs text-success-600 bg-success-50 px-3 py-2 rounded-md">
                Movimiento registrado exitosamente.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} size="sm">
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Registrando...</>
                ) : (
                  <><Plus className="h-3.5 w-3.5 mr-1.5" /> Registrar movimiento</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ═══ HISTORIAL ═══ */}
      {movements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Últimos movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {movements.map((m) => {
                const meta = MOVEMENT_LABELS[m.type] ?? { label: m.type, icon: Wrench, color: 'text-muted-foreground' };
                const Icon = meta.icon;
                const isPositive = m.amount > 0;
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{meta.label}</span>
                        <span className={`text-sm font-mono font-bold ${isPositive ? 'text-success-600' : 'text-error-600'}`}>
                          {isPositive ? '+' : ''}{formatCurrency(m.amount)}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(m.created_at)} · {m.created_by}
                        {m.external_reference && ` · Ref: ${m.external_reference}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ MODAL DE CONFIRMACIÓN ═══ */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar movimiento</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de registrar un movimiento en el fondo de capital. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">{MOVEMENT_LABELS[type]?.label ?? type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto:</span>
              <span className={`font-mono font-bold ${isNegativeOp ? 'text-error-600' : 'text-success-600'}`}>
                {isNegativeOp ? '-' : '+'}{formatCurrency(Math.abs(amountNum))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descripción:</span>
              <span className="text-right max-w-48 truncate">{description}</span>
            </div>
            {status && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Capital resultante:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(status.available_capital + (isNegativeOp ? -Math.abs(amountNum) : amountNum))}
                </span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMovement}>
              Confirmar y registrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
