import Link from 'next/link';
import { ArrowLeft, CreditCard, RefreshCw, User, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';
import { creditStatusInfo } from '@/modules/admin/credit-status-labels';
import { CreditAdminActions } from './CreditAdminActions';
import { ViewContractButton } from './ViewContractButton';

interface Props {
  data: AdminCreditSummary;
}

// Labels y color del indicador centralizados en `modules/admin/credit-status-labels`.

function buildFullName(client: AdminCreditSummary['client']) {
  if (!client) return null;
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

export function CreditDetailHeader({ data }: Props) {
  const statusConfig = creditStatusInfo(data.status);
  const clientName = buildFullName(data.client);

  return (
    <div className="space-y-4">
      {/* Navigation + Title */}
      <div className="flex items-center gap-3">
        <Link href="/admin/credits" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">
                {data.creditType === 'NEGOTIATION' ? 'Refinanciamiento' : 'Crédito'}
              </h1>
              <Badge variant={statusConfig.variant} title={statusConfig.description}>
                {statusConfig.label}
              </Badge>
              {data.creditType === 'NEGOTIATION' && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Negociación
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">{data.creditCode ?? `#${data.id.slice(0, 8)}`}</span>
              {clientName && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {clientName}
                    {data.client?.documentNumber && (
                      <span className="font-mono">({data.client.documentNumber})</span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data.applicationId && (
            <Link href={`/admin/applications/${data.applicationId}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Ver solicitud <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
          {data.client && (
            <Link href={`/admin/users/${data.userId}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Ver cliente <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
          {data.applicationId && <ViewContractButton creditId={data.id} />}
          <CreditAdminActions creditId={data.id} status={data.status} />
        </div>
      </div>

      {/* Origen — solo si es crédito de negociación */}
      {data.creditType === 'NEGOTIATION' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <RefreshCw className="h-4 w-4 text-primary" />
                Crédito de refinanciamiento — no tuvo desembolso real
              </span>
              {data.originCreditId && (
                <Link href={`/admin/credits/${data.originCreditId}`}>
                  <Badge variant="outline" className="cursor-pointer text-xs">Ver crédito origen</Badge>
                </Link>
              )}
              {data.rootCreditId && data.rootCreditId !== data.originCreditId && (
                <Link href={`/admin/credits/${data.rootCreditId}`}>
                  <Badge variant="outline" className="cursor-pointer text-xs">Ver crédito raíz</Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
