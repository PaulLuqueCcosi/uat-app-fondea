'use client';

import Link from 'next/link';
import { FileSignature, Clock, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDeadlineUrgency, type NegotiationOffer } from '@/modules/negotiation-offers';
import { formatBackendDateShort } from '@/modules/shared/backend-date';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface NegotiationOfferAlertProps {
  offers: NegotiationOffer[];
}

/**
 * Banner de "tienes ofertas de refinanciamiento pendientes de firma".
 *
 * Este es hoy el ÚNICO canal por el que el cliente se entera de una oferta
 * nueva (el correo real todavía no está implementado) — por eso se muestra
 * bien visible en el home, arriba del contenido, no escondido.
 *
 * Misma estructura visual que ActiveLoanCard (header con ícono + badge, tiles
 * de datos) para que se lea como parte del mismo dashboard. Soporta más de una
 * oferta simultánea (cuotas distintas del mismo crédito pueden negociarse en
 * paralelo): muestra el detalle de la más urgente y enlaza al listado.
 */
export function NegotiationOfferAlert({ offers }: NegotiationOfferAlertProps) {
  const mostUrgent = offers.reduce((acc, o) =>
    new Date(o.signDeadline).getTime() < new Date(acc.signDeadline).getTime() ? o : acc,
  offers[0]);
  const urgency = formatDeadlineUrgency(mostUrgent.signDeadline);
  const firstDueDate = mostUrgent.schedule[0]?.dueDate;
  const installmentCount = mostUrgent.schedule.length;
  const multiple = offers.length > 1;

  return (
    <Card className={urgency.urgent ? 'border-warning-300' : 'border-primary-200'}>
      <CardHeader>
        <CardTitle>
          {/* El chip de plazo va en la misma fila con ml-auto (no en CardAction): en mobile
              no entra al lado del título, así el flex-wrap lo baja solo a la línea siguiente. */}
          <span className="flex w-full flex-wrap items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            {multiple ? `Tienes ${offers.length} ofertas de refinanciamiento` : 'Oferta de refinanciamiento'}
            <Badge variant="warning">Pendiente de firma</Badge>
            <span
              className={`sm:ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                urgency.urgent
                  ? 'border-warning-300 bg-warning-50 text-warning-800'
                  : 'border-primary-200 bg-primary-50 text-primary-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {urgency.label}
            </span>
          </span>
        </CardTitle>
        <CardDescription>
          Te proponemos un nuevo cronograma para que te pongas al día con tu cuota vencida.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-primary-200 bg-primary-50 p-2.5">
            <p className="text-xs text-primary-700 mb-0.5">Nuevo total</p>
            <p className="text-sm sm:text-base font-bold text-primary-800">{formatCurrency(mostUrgent.totalAmount)}</p>
          </div>
          <div className="rounded-md border border-border bg-background p-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Cuotas</p>
            <p className="text-sm sm:text-base font-bold text-foreground">
              {installmentCount} cuota{installmentCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Primera cuota</p>
            <p className="text-sm sm:text-base font-bold text-foreground">{formatBackendDateShort(firstDueDate)}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Revisa el acuerdo y fírmalo en línea. Al firmar, tu cuota vencida queda refinanciada.
          </p>
          <Link href={multiple ? '/dashboard/creditos/ofertas' : `/dashboard/creditos/ofertas/${mostUrgent.id}`}>
            <Button size="sm" className="gap-1.5 w-full sm:w-auto">
              {multiple ? 'Ver mis ofertas' : 'Revisar y firmar'}
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
