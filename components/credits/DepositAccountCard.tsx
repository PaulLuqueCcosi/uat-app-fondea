'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Copy, Check, AlertCircle, Info } from 'lucide-react';
import type { DepositAccountConfig, DepositAccountError } from '@/modules/deposit-account';

interface DepositAccountCardProps {
  config: DepositAccountConfig | null;
  error: DepositAccountError | null;
}

/**
 * Datos para depositar, para el cliente.
 *
 * <p>Componente tonto: recibe la config ya resuelta. Antes la pantalla de declaración solo
 * decía "transfiere a la cuenta de Fondea" sin decir a cuál — el cliente tenía que
 * averiguarlo por fuera.
 *
 * <p>Si no hay cuenta configurada muestra el error con su call-to-action en vez de
 * desaparecer: el cliente necesita saber por qué no puede pagar y qué hacer.
 */
export function DepositAccountCard({ config, error }: DepositAccountCardProps) {
  if (!config) {
    return (
      <Card className="border-warning-100 bg-warning-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-warning-900">
            <AlertCircle className="w-4 h-4 text-warning-700" />
            No podemos mostrarte la cuenta
          </CardTitle>
          <CardDescription className="text-warning-700">
            {error?.message ??
              'No pudimos cargar los datos de la cuenta. Escríbenos por WhatsApp para que te indiquemos cómo pagar.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          Deposita a esta cuenta
        </CardTitle>
        <CardDescription>
          Transfiere el monto y luego sube tu comprobante acá abajo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <div className="divide-y divide-border rounded-lg border border-border">
            <CopyableRow label="Banco" value={config.bankName} copyable={false} />
            <CopyableRow label="Número de cuenta" value={config.accountNumber} mono />
            {config.cci && <CopyableRow label="CCI (otros bancos)" value={config.cci} mono />}
            <CopyableRow label="Titular" value={config.holderName} copyable={false} />
            {config.accountType && (
              <CopyableRow label="Tipo de cuenta" value={config.accountType} copyable={false} />
            )}
          </div>

          {config.qrImageUrl && (
            <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-center sm:justify-center sm:border-l sm:border-border sm:pl-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.qrImageUrl}
                alt={`Código QR para depositar a la cuenta de ${config.holderName}`}
                className="w-24 h-24 object-contain rounded-lg border border-border bg-white p-1.5"
              />
              <p className="text-[11px] font-medium text-muted-foreground text-center sm:max-w-24">
                Escanea el QR
              </p>
            </div>
          )}
        </div>

        {config.description && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border p-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * Fila con botón de copiar. El número de cuenta y el CCI se copian, no se transcriben a
 * mano: un dígito mal escrito manda la plata a otra cuenta.
 */
function CopyableRow({
  label, value, mono, copyable = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de clipboard (http, navegador viejo): el dato igual está visible,
      // así que no se muestra error — solo no se marca como copiado.
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm font-medium text-foreground truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>
        {copyable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
