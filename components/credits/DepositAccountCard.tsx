'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    <Card className="border-primary-200 bg-primary-50/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-primary-900">
          <Landmark className="w-4 h-4 text-primary-600" />
          Deposita a esta cuenta
        </CardTitle>
        <CardDescription className="text-primary-700">
          Transfiere el monto y luego sube tu comprobante acá abajo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <CopyableRow label="Banco" value={config.bankName} copyable={false} />
          <CopyableRow label="Número de cuenta" value={config.accountNumber} mono />
          {config.cci && <CopyableRow label="CCI (otros bancos)" value={config.cci} mono />}
          <CopyableRow label="Titular" value={config.holderName} copyable={false} />
          {config.accountType && (
            <CopyableRow label="Tipo de cuenta" value={config.accountType} copyable={false} />
          )}
        </div>

        {config.qrImageUrl && (
          <>
            <Separator />
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-primary-900">O escanea el QR</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.qrImageUrl}
                alt={`Código QR para depositar a la cuenta de ${config.holderName}`}
                className="w-40 h-40 object-contain rounded-lg border bg-white p-2"
              />
            </div>
          </>
        )}

        {config.description && (
          <div className="flex items-start gap-2 rounded-lg bg-white/70 border border-primary-100 p-3">
            <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-900">{config.description}</p>
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
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-primary-700 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm font-medium text-primary-900 truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>
        {copyable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 text-primary-600 hover:text-primary-900"
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
