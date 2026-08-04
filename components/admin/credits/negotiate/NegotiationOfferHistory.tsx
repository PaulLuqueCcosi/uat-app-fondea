import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import type { NegotiationOffer } from '@/modules/negotiation-offers';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SENT: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'outline',
};

const STATUS_LABEL: Record<string, string> = {
  SENT: 'Pendiente de firma',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  offers: NegotiationOffer[];
}

/**
 * Historial de intentos previos de negociación de una cuota (incluye
 * rechazadas/expiradas, no solo la vigente) — el admin necesita ver esto
 * antes de crear una nueva oferta para no repetir errores anteriores.
 */
export function NegotiationOfferHistory({ offers }: Props) {
  if (offers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Ofertas previas para esta cuota ({offers.length})
        </CardTitle>
        <CardDescription>Incluye rechazadas y expiradas — todo el ledger de negociación de esta cuota.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/admin/negotiation-offers/${offer.id}`}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatCurrency(offer.totalAmount)}</span>
                <Badge variant={STATUS_VARIANT[offer.status] ?? 'outline'} className="text-[10px]">
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Creada el {formatDateTime(offer.createdAt)} · {offer.schedule.length} cuota{offer.schedule.length !== 1 ? 's' : ''}
              </p>
              {offer.rejectionReason && (
                <p className="text-[11px] text-destructive mt-0.5">Motivo de rechazo: {offer.rejectionReason}</p>
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
