'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSignature, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMyNegotiationOffersAction } from '@/app/actions/negotiation-offer.actions';
import {
  isOfferSignable,
  formatDeadlineUrgency,
  negotiationOfferStatusLabels,
  type NegotiationOffer,
} from '@/modules/negotiation-offers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const statusBadgeVariant: Record<NegotiationOffer['status'], 'warning' | 'success' | 'error' | 'pending'> = {
  SENT: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'pending',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OffersSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="h-24 rounded-lg border border-border bg-neutral-50" />
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NegotiationOffersPage() {
  const [offers, setOffers] = useState<NegotiationOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      const result = await getMyNegotiationOffersAction();
      if (result.ok) {
        setOffers(result.data);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    }
    fetchOffers();
  }, []);

  const pendingOffers = offers.filter((o) => isOfferSignable(o));
  const otherOffers = offers.filter((o) => !isOfferSignable(o));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link
        href="/dashboard/creditos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis Créditos
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary" />
          Ofertas de refinanciamiento
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Propuestas para cerrar cuotas en mora, negociadas con nuestro equipo.
        </p>
      </div>

      {loading ? (
        <OffersSkeleton />
      ) : error ? (
        <Card className="border-error-200 bg-error-50/50">
          <CardContent className="py-6 text-center text-sm text-error-700">{error}</CardContent>
        </Card>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
            <FileSignature className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No tienes ofertas de refinanciamiento en este momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingOffers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pendientes de firma ({pendingOffers.length})
              </p>
              {pendingOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}

          {otherOffers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Historial
              </p>
              {otherOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card de oferta ───────────────────────────────────────────────────────────

function OfferCard({ offer }: { offer: NegotiationOffer }) {
  const signable = isOfferSignable(offer);
  const urgency = offer.status === 'SENT' ? formatDeadlineUrgency(offer.signDeadline) : null;

  return (
    <Link href={`/dashboard/creditos/ofertas/${offer.id}`} className="block group">
      <Card className={signable && urgency?.urgent ? 'border-warning-300' : ''}>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(offer.totalAmount)}
              </span>
              <Badge variant={statusBadgeVariant[offer.status]}>
                {negotiationOfferStatusLabels[offer.status]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {offer.schedule.length} cuota{offer.schedule.length !== 1 ? 's' : ''} · Creada el {formatDate(offer.createdAt)}
            </p>
            {urgency && (
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                urgency.urgent ? 'text-warning-700' : 'text-muted-foreground'
              }`}>
                {urgency.urgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {urgency.label} para firmar
              </p>
            )}
          </div>
          {signable ? (
            <Button size="sm" className="bg-accent-500 text-accent-900 hover:bg-accent-400 shrink-0">
              Revisar y firmar
            </Button>
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
