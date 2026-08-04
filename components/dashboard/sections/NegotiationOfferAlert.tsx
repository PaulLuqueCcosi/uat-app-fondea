'use client';

import Link from 'next/link';
import { FileSignature, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDeadlineUrgency, type NegotiationOffer } from '@/modules/negotiation-offers';

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
 * Soporta más de una oferta simultánea (cuotas distintas del mismo crédito
 * pueden negociarse en paralelo).
 */
export function NegotiationOfferAlert({ offers }: NegotiationOfferAlertProps) {
  const mostUrgent = offers.reduce((acc, o) =>
    new Date(o.signDeadline).getTime() < new Date(acc.signDeadline).getTime() ? o : acc,
  offers[0]);
  const urgency = formatDeadlineUrgency(mostUrgent.signDeadline);

  return (
    <Card className={urgency.urgent ? 'border-warning-300 bg-warning-50/60' : 'border-primary-200 bg-primary-50/40'}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            urgency.urgent ? 'bg-warning-100' : 'bg-primary-100'
          }`}>
            {urgency.urgent ? (
              <AlertTriangle className="w-5 h-5 text-warning-700" />
            ) : (
              <FileSignature className="w-5 h-5 text-primary-700" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${urgency.urgent ? 'text-warning-900' : 'text-primary-900'}`}>
              {offers.length === 1
                ? 'Tienes una oferta de refinanciamiento pendiente de firma'
                : `Tienes ${offers.length} ofertas de refinanciamiento pendientes de firma`}
            </p>
            <p className={`text-xs mt-0.5 flex items-center gap-1 ${urgency.urgent ? 'text-warning-700' : 'text-primary-700'}`}>
              <Clock className="w-3.5 h-3.5" />
              {offers.length === 1
                ? `${formatCurrency(mostUrgent.totalAmount)} · ${urgency.label} para firmar`
                : `La más próxima ${urgency.label.toLowerCase()}`}
            </p>

            {offers.length === 1 ? (
              <Link href={`/dashboard/creditos/ofertas/${mostUrgent.id}`}>
                <Button
                  size="sm"
                  className={`mt-3 gap-1.5 ${
                    urgency.urgent
                      ? 'bg-warning-500 text-warning-900 hover:bg-warning-400'
                      : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
                  }`}
                >
                  Revisar y firmar
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/creditos/ofertas">
                <Button
                  size="sm"
                  className={`mt-3 gap-1.5 ${
                    urgency.urgent
                      ? 'bg-warning-500 text-warning-900 hover:bg-warning-400'
                      : 'bg-accent-500 text-accent-900 hover:bg-accent-400'
                  }`}
                >
                  Ver todas mis ofertas
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
