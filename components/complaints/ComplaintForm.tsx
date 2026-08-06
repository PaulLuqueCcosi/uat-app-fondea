'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Send } from 'lucide-react';
import { submitComplaintAction } from '@/app/actions/complaint.actions';
import { COMPLAINT_TYPE_OPTIONS } from '@/modules/complaints';
import type { ComplaintType } from '@/modules/complaints';

interface ComplaintFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ComplaintForm({ onSuccess, onCancel }: ComplaintFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<ComplaintType>('RECLAMO');
  const [consumerPhone, setConsumerPhone] = useState('');
  const [consumerEmail, setConsumerEmail] = useState('');
  const [productServiceDetail, setProductServiceDetail] = useState('');
  const [amountInvolved, setAmountInvolved] = useState('');
  const [complaintDetail, setComplaintDetail] = useState('');
  const [consumerRequest, setConsumerRequest] = useState('');

  const selectedTypeOption = COMPLAINT_TYPE_OPTIONS.find((o) => o.value === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consumerPhone.trim() || !consumerEmail.trim() || !productServiceDetail.trim() || !complaintDetail.trim() || !consumerRequest.trim()) {
      setError('Todos los campos obligatorios deben estar completos.');
      return;
    }

    startTransition(async () => {
      const result = await submitComplaintAction({
        type,
        consumerPhone: consumerPhone.trim(),
        consumerEmail: consumerEmail.trim(),
        productServiceDetail: productServiceDetail.trim(),
        amountInvolved: amountInvolved ? Number(amountInvolved) : undefined,
        complaintDetail: complaintDetail.trim(),
        consumerRequest: consumerRequest.trim(),
      });

      if (result.ok) {
        onSuccess?.();
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar reclamo o queja</CardTitle>
        <p className="text-xs text-muted-foreground">
          Ley 32495 — Tienes derecho a registrar un reclamo y recibir respuesta en máximo 15 días hábiles.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo *</Label>
            <NativeSelect
              value={type}
              onChange={(e) => setType(e.target.value as ComplaintType)}
              className="h-9"
              disabled={isPending}
            >
              {COMPLAINT_TYPE_OPTIONS.map((opt) => (
                <NativeSelectOption key={opt.value} value={opt.value}>
                  {opt.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {selectedTypeOption && (
              <p className="text-[11px] text-muted-foreground">{selectedTypeOption.description}</p>
            )}
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Celular de contacto *</Label>
              <Input
                type="tel"
                placeholder="987654321"
                value={consumerPhone}
                onChange={(e) => setConsumerPhone(e.target.value)}
                disabled={isPending}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email de contacto *</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={consumerEmail}
                onChange={(e) => setConsumerEmail(e.target.value)}
                disabled={isPending}
                className="h-9"
              />
            </div>
          </div>

          {/* Producto/servicio */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Producto o servicio relacionado *</Label>
            <Input
              placeholder="Ej: Cuota de crédito #2, Cobro de mora"
              value={productServiceDetail}
              onChange={(e) => setProductServiceDetail(e.target.value)}
              disabled={isPending}
              className="h-9"
            />
          </div>

          {/* Monto involucrado (opcional) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Monto involucrado (opcional)</Label>
            <Input
              type="number"
              placeholder="S/ 0.00"
              value={amountInvolved}
              onChange={(e) => setAmountInvolved(e.target.value)}
              disabled={isPending}
              className="h-9"
              step="0.01"
              min="0"
            />
          </div>

          {/* Detalle del reclamo */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Describe tu reclamo *</Label>
            <Textarea
              placeholder="Explica con detalle qué sucedió..."
              value={complaintDetail}
              onChange={(e) => setComplaintDetail(e.target.value)}
              disabled={isPending}
              rows={4}
            />
          </div>

          {/* Pedido del consumidor */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">¿Qué solución esperas? *</Label>
            <Textarea
              placeholder="Ej: Que me devuelvan el monto cobrado de más, que corrijan el cobro..."
              value={consumerRequest}
              onChange={(e) => setConsumerRequest(e.target.value)}
              disabled={isPending}
              rows={3}
            />
            <p className="text-[10px] text-muted-foreground">
              Indica qué acción esperas que tomemos para resolver tu caso.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar reclamo
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
