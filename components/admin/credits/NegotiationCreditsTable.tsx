'use client';

import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { negotiationOfferStatusLabels, type NegotiationOffer } from '@/modules/negotiation-offers';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SENT: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'outline',
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  offers: NegotiationOffer[];
  isLoading?: boolean;
}

/**
 * Tabla de ofertas de negociación para el tab "Créditos de Negociación".
 *
 * No existe hoy un endpoint que liste créditos filtrados por credit_type=NEGOTIATION
 * — se construye desde las ofertas (cada oferta ACCEPTED con resultingCreditId ES
 * el crédito de negociación). Un crédito de negociación siempre nace de una oferta,
 * así que esta vista es equivalente y además da más contexto (cuota origen, cronograma).
 */
export function NegotiationCreditsTable({ offers, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No hay ofertas de negociación con este filtro.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Oferta</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Cliente</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Monto</th>
                <th className="text-center py-2 px-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Creada</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Crédito</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-2 px-4">
                    <Link href={`/admin/negotiation-offers/${offer.id}`} className="font-mono text-xs text-primary hover:underline">
                      #{offer.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium truncate max-w-40">
                        {offer.clientName || 'Sin nombre'}
                      </span>
                      {offer.clientDocument && (
                        <span className="font-mono text-[10px] text-muted-foreground">{offer.clientDocument}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{formatCurrency(offer.totalAmount)}</td>
                  <td className="py-2 px-4 text-center">
                    <Badge variant={STATUS_VARIANT[offer.status] ?? 'outline'} className="text-[10px]">
                      {negotiationOfferStatusLabels[offer.status]}
                    </Badge>
                  </td>
                  <td className="py-2 px-4 text-xs text-muted-foreground">{formatDateTime(offer.createdAt)}</td>
                  <td className="py-2 px-4 text-right">
                    {offer.resultingCreditId ? (
                      <Link
                        href={`/admin/credits/${offer.resultingCreditId}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Ver crédito <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
