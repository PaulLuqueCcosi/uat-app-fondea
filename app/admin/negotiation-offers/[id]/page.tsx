import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileSignature, ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getAdminNegotiationOfferByIdAction } from '@/app/actions/negotiation-offer.actions';
import { negotiationOfferStatusLabels } from '@/modules/negotiation-offers';

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SENT: 'secondary',
  ACCEPTED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'outline',
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminNegotiationOfferDetailPage({ params }: Props) {
  const { id } = await params;

  const result = await getAdminNegotiationOfferByIdAction(id);
  if (!result.ok) notFound();

  const { offer, documents } = result.data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/negotiation-offers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Oferta de refinanciamiento</h1>
            <p className="text-xs text-muted-foreground font-mono">#{offer.id.slice(0, 8)}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[offer.status] ?? 'outline'} className="ml-auto">
          {negotiationOfferStatusLabels[offer.status]}
        </Badge>
      </div>

      {/* Info general */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Cliente</p>
              <p className="text-xs font-medium">{offer.clientName || 'Sin nombre'}</p>
              {offer.clientDocument && (
                <p className="text-[11px] text-muted-foreground font-mono">DNI {offer.clientDocument}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Crédito origen</p>
              <Link href={`/admin/credits/${offer.originCreditId}`} className="text-primary hover:underline font-mono text-xs">
                #{offer.originCreditId.slice(0, 8)}
              </Link>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Creada por</p>
              <p className="text-xs">{offer.createdBy}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Creada el</p>
              <p className="text-xs">{formatDateTime(offer.createdAt)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Plazo de firma</p>
              <p className="text-xs">{formatDateTime(offer.signDeadline)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Respondida el</p>
              <p className="text-xs">{offer.respondedAt ? formatDateTime(offer.respondedAt) : '—'}</p>
            </div>
          </div>

          {offer.rejectionReason && (
            <>
              <Separator className="my-3" />
              <div>
                <p className="text-[11px] text-muted-foreground">Motivo de rechazo</p>
                <p className="text-sm text-destructive">{offer.rejectionReason}</p>
              </div>
            </>
          )}

          {offer.status === 'ACCEPTED' && (
            <>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">Crédito resultante</p>
                  <p className="text-xs">
                    {offer.resultingCreditId
                      ? 'El crédito de negociación ya se creó.'
                      : 'Firmada — el crédito se está creando (proceso asíncrono, normalmente toma segundos).'}
                  </p>
                </div>
                {offer.resultingCreditId && (
                  <Link href={`/admin/credits/${offer.resultingCreditId}`}>
                    <Badge variant="outline" className="cursor-pointer gap-1">
                      Ver crédito <ExternalLink className="h-3 w-3" />
                    </Badge>
                  </Link>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cronograma */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cronograma propuesto</CardTitle>
          <CardDescription>Definido manualmente por el admin al crear la oferta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-1.5 font-medium text-muted-foreground">Vencimiento</th>
                  <th className="text-right py-1.5 font-medium text-muted-foreground">Monto</th>
                </tr>
              </thead>
              <tbody>
                {offer.schedule.map((item) => (
                  <tr key={item.installmentNo} className="border-b last:border-0">
                    <td className="py-1.5 font-mono text-primary">{item.installmentNo}</td>
                    <td className="py-1.5">{new Date(item.dueDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="py-1.5 text-right font-mono">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Separator className="my-2" />
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">Total</span>
              <span className="text-base font-semibold">{formatCurrency(offer.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{doc.name}</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Ver documento
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Disponible al firmar</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
