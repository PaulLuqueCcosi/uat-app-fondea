import { Handshake } from 'lucide-react';
import { getAdminNegotiationOffersPaginatedAction } from '@/app/actions/negotiation-offer.actions';
import { NegotiationOffersTable } from '@/components/admin/negotiation-offers/NegotiationOffersTable';
import type { NegotiationOfferStatus } from '@/modules/negotiation-offers';

interface Props {
  searchParams: Promise<{
    page?: string;
    size?: string;
    status?: string;
  }>;
}

export default async function AdminNegotiationOffersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Number(params.size) || 20;
  const status = (params.status as NegotiationOfferStatus) || undefined;

  const result = await getAdminNegotiationOffersPaginatedAction(page - 1, pageSize, status);

  const offers = result.ok ? result.data.content : [];
  const pagination = result.ok
    ? {
        page: result.data.number + 1,
        pageSize: result.data.size,
        totalItems: result.data.totalElements,
        totalPages: result.data.totalPages,
      }
    : { page, pageSize, totalItems: 0, totalPages: 0 };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Handshake className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Negociaciones</h1>
          <p className="text-sm text-muted-foreground">
            Ofertas de refinanciamiento enviadas a clientes en mora
          </p>
        </div>
      </div>

      <NegotiationOffersTable
        offers={offers}
        pagination={pagination}
        currentStatus={status ?? 'all'}
      />
    </div>
  );
}
