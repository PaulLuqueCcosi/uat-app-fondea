'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getAdminAlertRecipients } from '@/modules/admin/admin-notification-recipients.service';
import type { AdminAlertRecipient } from '@/modules/admin/admin-notification-recipients.types';

/**
 * Card resumen de los destinatarios de alertas en la página general de settings.
 * El detalle y la edición viven en /admin/settings/notification-recipients.
 */
export function NotificationRecipientsCard() {
  const [recipients, setRecipients] = useState<AdminAlertRecipient[] | undefined>(undefined);

  useEffect(() => {
    getAdminAlertRecipients().then(setRecipients);
  }, []);

  const activeCount = recipients?.filter((r) => r.active).length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Destinatarios de Alertas
          </CardTitle>
          <Link href="/admin/settings/notification-recipients">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Configurar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          Correos que reciben avisos operativos (ej. comprobantes nuevos para revisar)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recipients === undefined ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : activeCount === 0 ? (
          <div className="flex items-start gap-2 py-2">
            <AlertCircle className="h-4 w-4 text-warning-700 shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700">
              Sin destinatarios activos — las alertas operativas no le llegan a nadie.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">Activos</span>
            <Badge variant="success" className="text-[10px]">{activeCount} correo{activeCount === 1 ? '' : 's'}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
