'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Wallet, RotateCcw, Loader2, ArrowUpCircle, ArrowDownCircle,
  Wrench, History, RefreshCw, AlertTriangle,
} from 'lucide-react';
import {
  getFundStatusAction, registerFundMovementAction, getFundMovementsAction,
  type FundStatus, type FundMovement, type FundMovementType,
} from '@/app/actions/portfolio.actions';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<string, { label: string; icon: typeof Wrench; color: string }> = {
  CAPITAL_INJECTION: { label: 'Depósito', icon: ArrowUpCircle, color: 'text-success-600' },
  PROFIT_WITHDRAWAL: { label: 'Retiro', icon: ArrowDownCircle, color: 'text-error-600' },
  BANK_SYNC: { label: 'Sincronización banco', icon: RefreshCw, color: 'text-primary' },
  MANUAL_ADJUSTMENT: { label: 'Ajuste manual', icon: Wrench, color: 'text-warning-600' },
  LOAN_DISBURSEMENT: { label: 'Desembolso préstamo', icon: ArrowDownCircle, color: 'text-error-500' },
  LOAN_REPAYMENT: { label: 'Pago cuota', icon: ArrowUpCircle, color: 'text-success-500' },
};

function fmt(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type ActionType = 'adjust' | 'deposit' | 'withdraw' | null;

// ── Component ─────────────────────────────────────────────────────────────────

export function FundManagement() {
  const [status, setStatus] = useState<FundStatus | null>(null);
  const [movements, setMovements] = useState<FundMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: FundMovementType;
    amount: number;
    description: string;
    reference: string;
    label: string;
    resultCapital: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([
        getFundStatusAction(),
        getFundMovementsAction(30),
      ]);
      setStatus(s);
      setMovements(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del fondo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function resetForm() {
    setActiveAction(null);
    setAmount('');
    setDescription('');
    setReference('');
    setActionError(null);
  }

  function validateAndConfirm() {
    setActionError(null);
    const value = Number(amount);

    if (!amount || isNaN(value) || value <= 0) {
      setActionError('Ingresa un monto válido mayor a 0');
      return;
    }

    if (!description.trim()) {
      setActionError('La descripción es obligatoria (queda en auditoría)');
      return;
    }

    const currentCapital = status?.total_capital ?? 0;
    let movementType: FundMovementType;
    let effectiveAmount: number;
    let resultCapital: number;
    let label: string;

    switch (activeAction) {
      case 'adjust':
        // Ajuste manual: setea el capital al valor ingresado
        effectiveAmount = value - currentCapital;
        resultCapital = value;
        movementType = 'MANUAL_ADJUSTMENT';
        label = 'Ajuste manual';
        break;

      case 'deposit':
        effectiveAmount = value;
        resultCapital = currentCapital + value;
        movementType = 'CAPITAL_INJECTION';
        label = 'Depósito';
        break;

      case 'withdraw':
        if (value > currentCapital) {
          setActionError(`No puedes retirar más de lo que tiene el fondo (${fmt(currentCapital)})`);
          return;
        }
        effectiveAmount = -value;
        resultCapital = currentCapital - value;
        movementType = 'PROFIT_WITHDRAWAL';
        label = 'Retiro';
        break;

      default:
        return;
    }

    setPendingAction({
      type: movementType,
      amount: effectiveAmount,
      description: description.trim(),
      reference: reference.trim(),
      label,
      resultCapital,
    });
    setShowConfirm(true);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setShowConfirm(false);
    setSubmitting(true);

    try {
      await registerFundMovementAction(
        pendingAction.type,
        pendingAction.amount,
        pendingAction.description,
        pendingAction.reference || undefined
      );
      resetForm();
      await fetchData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading && !status) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  if (error && !status) {
    return (
      <Card className="max-w-lg">
        <CardContent className="p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-warning-500 mx-auto" />
          <p className="text-sm text-error-700">{error}</p>
          <p className="text-xs text-muted-foreground">
            Es posible que no exista un fondo configurado. Reinicia la aplicación para que se cree automáticamente.
          </p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentCapital = status?.total_capital ?? 0;

  return (
    <div className="space-y-6">
      {/* ═══ ESTADO DEL FONDO ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Estado actual
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={fetchData} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Capital total</p>
                <p className="text-xl font-bold">{fmt(status.total_capital)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disponible</p>
                <p className="text-xl font-bold text-success-600">{fmt(status.available_capital)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colocado</p>
                <p className="text-sm font-medium">{fmt(status.total_deployed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilización</p>
                <p className="text-sm font-medium">{status.utilization_rate}%</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-warning-600">Fondo no disponible.</p>
          )}
        </CardContent>
      </Card>

      {/* ═══ ACCIONES + HISTORIAL (side by side en desktop) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── ACCIONES ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Operaciones</CardTitle>
          </CardHeader>
          <CardContent>
          {/* Botones de acción */}
          {!activeAction && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveAction('adjust')}
              >
                <Wrench className="h-5 w-5 text-warning-600" />
                <span className="text-xs">Ajuste manual</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveAction('deposit')}
              >
                <ArrowUpCircle className="h-5 w-5 text-success-600" />
                <span className="text-xs">Depositar</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveAction('withdraw')}
              >
                <ArrowDownCircle className="h-5 w-5 text-error-600" />
                <span className="text-xs">Retirar</span>
              </Button>
            </div>
          )}

          {/* Formulario activo */}
          {activeAction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {activeAction === 'adjust' && '🔧 Ajuste manual — establece el capital total'}
                  {activeAction === 'deposit' && '💰 Depositar — se suma al capital actual'}
                  {activeAction === 'withdraw' && '📤 Retirar — se resta del capital actual'}
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">
                  {activeAction === 'adjust' ? 'Nuevo capital total (S/)' : 'Monto (S/)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setActionError(null); }}
                  placeholder={activeAction === 'adjust' ? `Actual: ${fmt(currentCapital)}` : 'Ej: 50000'}
                  className="h-10 font-mono text-lg"
                  disabled={submitting}
                  autoFocus
                />
                {activeAction === 'adjust' && (
                  <p className="text-xs text-muted-foreground">
                    Capital actual: {fmt(currentCapital)}. El nuevo valor reemplaza el actual.
                  </p>
                )}
                {activeAction === 'withdraw' && (
                  <p className="text-xs text-muted-foreground">
                    Máximo retirable: {fmt(currentCapital)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Descripción (obligatoria)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Depósito socio Juan — transferencia BCP"
                  className="min-h-[60px] resize-none"
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

              {actionError && (
                <p className="text-xs text-error-700 bg-error-50 px-3 py-2 rounded-md">{actionError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={resetForm} disabled={submitting}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={validateAndConfirm} disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Procesando...</>
                  ) : (
                    'Confirmar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* ─── HISTORIAL ─── */}
        <Card className={movements.length === 0 ? 'hidden lg:block' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Historial de movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sin movimientos registrados</p>
            ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {movements.map((m) => {
                const meta = MOVEMENT_LABELS[m.type] ?? { label: m.type, icon: Wrench, color: 'text-muted-foreground' };
                const Icon = meta.icon;
                const isPositive = m.amount > 0;
                return (
                  <div key={m.id} className="flex items-start gap-3 py-2.5 border-b last:border-b-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{meta.label}</span>
                        <span className={`text-sm font-mono font-bold shrink-0 ${isPositive ? 'text-success-600' : 'text-error-600'}`}>
                          {isPositive ? '+' : ''}{fmt(m.amount)}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-muted-foreground">
                          {fmtDate(m.created_at)} · {m.created_by}
                        </p>
                        {m.external_reference && (
                          <p className="text-[10px] text-muted-foreground">· Ref: {m.external_reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">Saldo después</p>
                      <p className="text-xs font-mono">{fmt(m.balance_after)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ MODAL DE CONFIRMACIÓN ═══ */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-500" />
              Confirmar operación
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción modifica el capital del fondo. Revisa los datos antes de confirmar.
              El movimiento quedará registrado en auditoría y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingAction && (
            <div className="space-y-3 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operación:</span>
                <span className="font-medium">{pendingAction.label}</span>
              </div>

              {activeAction === 'adjust' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capital actual:</span>
                    <span className="font-mono">{fmt(currentCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nuevo capital:</span>
                    <span className="font-mono font-bold">{fmt(pendingAction.resultCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diferencia:</span>
                    <span className={`font-mono font-bold ${pendingAction.amount >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {pendingAction.amount >= 0 ? '+' : ''}{fmt(pendingAction.amount)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto:</span>
                    <span className={`font-mono font-bold ${pendingAction.amount >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {pendingAction.amount >= 0 ? '+' : ''}{fmt(pendingAction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capital resultante:</span>
                    <span className="font-mono font-bold">{fmt(pendingAction.resultCapital)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Descripción:</span>
                <span className="text-right max-w-52 text-xs">{pendingAction.description}</span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              Confirmar y registrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
