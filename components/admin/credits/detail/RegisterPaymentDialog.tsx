'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Banknote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  registerManualPaymentAction,
  type ManualPaymentMethod,
} from '@/app/actions/admin-credits.actions';
import { getPaymentQuoteAction } from '@/app/actions/payment-declaration.actions';
import type { PaymentQuote } from '@/modules/payment-declarations';
import { formatCurrency } from '@/lib/admin-formatters';

interface Props {
  creditId: string;
  installmentNo: number;
}

const METHODS: Array<{ value: ManualPaymentMethod; label: string }> = [
  { value: 'BANK_TRANSFER', label: 'Transferencia bancaria' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'OTHER', label: 'Otro' },
];

/**
 * Registro manual de un pago apuntando a una cuota (el que se hizo fuera de la plataforma).
 *
 * Al abrir pide la cotización al backend: el tope es `maximumAllowed` (suma de lo cobrable
 * hasta esta cuota, con la mora ya sincronizada). Nunca se cobra de cuotas posteriores.
 * Confirmar registra el pago y queda en el historial de transacciones con la marca de quién lo hizo.
 */
export function RegisterPaymentDialog({ creditId, installmentNo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<ManualPaymentMethod>('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setQuote(null);
    setQuoteError(null);
    getPaymentQuoteAction(creditId, installmentNo).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setQuote(result.data);
        setAmount(result.data.maximumAllowed.toFixed(2));
      } else {
        setQuoteError(result.error.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, creditId, installmentNo]);

  const value = Number(amount);
  const max = quote?.maximumAllowed ?? 0;
  const invalid = !quote || !Number.isFinite(value) || value <= 0 || value > max + 0.001;

  function submit() {
    startTransition(async () => {
      const result = await registerManualPaymentAction(creditId, installmentNo, {
        amount: value,
        paymentMethod: method,
        referenceNumber: reference,
        transactionDate: date,
      });
      if (result.ok) {
        toast.success(`Pago registrado: ${formatCurrency(result.totalApplied ?? value)}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Banknote className="h-4 w-4" />
        Registrar pago
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago de la cuota {installmentNo}</DialogTitle>
          <DialogDescription>
            Para pagos hechos fuera de la plataforma. Se aplica primero a la mora, luego al interés y al capital,
            empezando por las cuotas más antiguas. Nunca cobra cuotas posteriores a esta.
          </DialogDescription>
        </DialogHeader>

        {quoteError && <p className="text-sm text-destructive">{quoteError}</p>}
        {!quote && !quoteError && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando el monto máximo…
          </p>
        )}

        {quote && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máximo a registrar</span>
                <span className="font-semibold">{formatCurrency(max)}</span>
              </div>
              {quote.penaltyBreakdown.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Incluye mora acumulada por concepto.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Monto (S/)</Label>
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {quote && value > max + 0.001 && (
                <p className="text-xs text-destructive">No puede superar {formatCurrency(max)}.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-method">Medio de pago</Label>
                <NativeSelect
                  id="pay-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ManualPaymentMethod)}
                >
                  {METHODS.map((m) => (
                    <NativeSelectOption key={m.value} value={m.value}>
                      {m.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-date">Fecha del pago</Label>
                <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">N.º de operación (opcional)</Label>
              <Input id="pay-ref" value={reference} maxLength={60} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={invalid || pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
