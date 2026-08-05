import Link from 'next/link';
import { ArrowLeft, CreditCard, RefreshCw, User, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import type { AdminCreditSummary } from '@/modules/admin/admin-credit-detail.service';

interface Props {
  data: AdminCreditSummary;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  ACTIVE: { label: 'Activo', variant: 'default', color: 'bg-emerald-500' },
  OVERDUE: { label: 'Vencido', variant: 'secondary', color: 'bg-amber-500' },
  DEFAULTED: { label: 'En mora grave', variant: 'destructive', color: 'bg-red-500' },
  PAID_OFF: { label: 'Liquidado', variant: 'outline', color: 'bg-neutral-400' },
};

function formatCurrency(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function buildFullName(client: AdminCreditSummary['client']) {
  if (!client) return null;
  return [client.firstName, client.secondName, client.paternalSurname, client.maternalSurname]
    .filter(Boolean)
    .join(' ');
}

export function CreditDetailHeader({ data }: Props) {
  const statusConfig = STATUS_CONFIG[data.status] ?? { label: data.status, variant: 'outline' as const, color: 'bg-neutral-400' };
  const interestEarned = data.totalDue - data.principal;
  const progressPercent = data.totalDue > 0
    ? Math.min(100, Math.round(((data.totalDue - computeOutstanding(data)) / data.totalDue) * 100))
    : 0;
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
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              {data.creditType === 'NEGOTIATION' && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Negociación
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">#{data.id.slice(0, 8)}</span>
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

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Capital desembolsado" value={formatCurrency(data.principal)} />
        <KpiCard label="Total a pagar" value={formatCurrency(data.totalDue)} sub={`+${formatCurrency(interestEarned)} interés`} />
        <KpiCard label="Cuotas" value={`${data.installmentCount}`} sub={`Plazo ${data.termDays}d`} />
        <KpiCard
          label="Progreso"
          value={`${progressPercent}%`}
          sub={`${data.status === 'PAID_OFF' ? 'Completado' : 'pagado'}`}
          progress={progressPercent}
          progressColor={statusConfig.color}
        />
        <KpiCard
          label={data.status === 'PAID_OFF' ? 'Cerrado' : 'Pendiente'}
          value={data.status === 'PAID_OFF' ? '✓ Liquidado' : formatCurrency(computeOutstanding(data))}
          highlight={data.status !== 'PAID_OFF'}
        />
      </div>
    </div>
  );
}

function computeOutstanding(data: AdminCreditSummary): number {
  // Approximate outstanding from available data
  // The exact value comes from installments, but we can estimate here
  return Math.max(0, data.totalDue - (data.totalDue * 0)); // placeholder - real value from installments
}

function KpiCard({ label, value, sub, highlight, progress, progressColor }: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className={`text-lg font-bold mt-1 leading-tight ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      {progress != null && (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressColor ?? 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
