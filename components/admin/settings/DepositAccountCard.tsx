'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, ArrowRight, Loader2, AlertCircle, QrCode } from 'lucide-react';
import Link from 'next/link';
import { getAdminActiveDepositAccountAction } from '@/app/actions/deposit-account.actions';
import type { DepositAccountConfig } from '@/modules/deposit-account';

/**
 * Card resumen de la cuenta de depósito en la página general de settings.
 * El detalle y la edición viven en /admin/settings/deposit-account.
 */
export function DepositAccountCard() {
  const [config, setConfig] = useState<DepositAccountConfig | null | undefined>(undefined);

  useEffect(() => {
    getAdminActiveDepositAccountAction().then((res) => {
      setConfig(res.ok ? res.data : null);
    });
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary-600" /> Cuenta de Depósito
          </CardTitle>
          <Link href="/admin/settings/deposit-account">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Configurar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          Banco, cuenta y QR que ve el cliente al pagar una cuota
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {config === undefined ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : config ? (
          <>
            <div className="flex items-center justify-between py-1.5 gap-2">
              <span className="text-sm text-foreground">{config.bankName}</span>
              <span className="text-xs font-mono text-muted-foreground truncate">
                {config.accountNumber}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 gap-2">
              <span className="text-sm text-muted-foreground">Titular</span>
              <span className="text-sm truncate">{config.holderName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5" /> QR
              </span>
              <Badge variant={config.qrImageUrl ? 'success' : 'secondary'} className="text-[10px]">
                {config.qrImageUrl ? 'Cargado' : 'Sin imagen'}
              </Badge>
            </div>
          </>
        ) : (
          // Sin cuenta el cliente no puede depositar — se avisa acá, no solo en la
          // pantalla de detalle.
          <div className="flex items-start gap-2 py-2">
            <AlertCircle className="h-4 w-4 text-warning-700 shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700">
              Sin configurar — los clientes no pueden ver a dónde depositar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
