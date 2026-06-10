import Link from 'next/link';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Wallet,
  CircleDollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTitle } from '@/components/ui/page-title';
import { getUserCredits, getCreditsSummary } from '@/lib/credits';
import type { Credit, CreditStatus } from '@/lib/credits';

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Componentes internos ─────────────────────────────────────────────────────

const statusConfig: Record<CreditStatus, { label: string; variant: 'success' | 'completed' | 'error' | 'default'; icon: typeof Clock }> = {
  ACTIVE: { label: 'Activo', variant: 'success', icon: Clock },
  COMPLETED: { label: 'Completado', variant: 'completed', icon: CheckCircle },
  OVERDUE: { label: 'Vencido', variant: 'error', icon: AlertCircle },
  DEFAULTED: { label: 'En mora', variant: 'error', icon: AlertCircle },
};

function StatusBadge({ status }: { status: CreditStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1 text-[10px]">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function CreditRow({ credit }: { credit: Credit }) {
  const progress = Math.round((credit.paidInstallments / credit.totalInstallments) * 100);

  return (
    <Link href={`/dashboard/creditos/${credit.id}`} className="block group">
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted/50">
        {/* Icono */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            credit.status === 'ACTIVE'
              ? 'bg-primary/10'
              : credit.status === 'COMPLETED'
                ? 'bg-success-50'
                : 'bg-error-50'
          }`}
        >
          <CreditCard
            className={`w-4 h-4 ${
              credit.status === 'ACTIVE'
                ? 'text-primary'
                : credit.status === 'COMPLETED'
                  ? 'text-success-600'
                  : 'text-error-500'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(credit.amount)}
            </span>
            <StatusBadge status={credit.status} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{formatDate(credit.disbursedDate)}</span>
            <span className="text-neutral-300">·</span>
            <span>{credit.paidInstallments}/{credit.totalInstallments} cuotas</span>
          </div>
          {/* Progress bar */}
          <div className="h-1 overflow-hidden rounded-full bg-neutral-100 mt-1.5">
            <div
              className={`h-full rounded-full transition-all ${
                credit.status === 'COMPLETED' ? 'bg-success-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="text-right shrink-0 hidden sm:block">
          {credit.nextDueDate && (
            <p className="text-[11px] text-muted-foreground">
              Próx. {formatDate(credit.nextDueDate)}
            </p>
          )}
          <p className="text-xs font-medium text-foreground">
            {formatCurrency(credit.pendingBalance)}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
      </div>
    </Link>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default async function CreditosPage() {
  const [credits, summary] = await Promise.all([
    getUserCredits(),
    getCreditsSummary(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageTitle
        title="Mis Créditos"
        description="Todos tus préstamos desembolsados. Revisa estado, cuotas y comprobantes."
      />
        {/* Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-4 pb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-tight">Activos</p>
                <p className="text-xl font-bold text-primary">{summary.activeCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 pt-4 pb-3">
              <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-success-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-tight">Completados</p>
                <p className="text-xl font-bold text-success-700">{summary.completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="flex items-center gap-3 pt-4 pb-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-tight">Saldo pendiente</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(summary.totalPendingBalance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de créditos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
              Historial de créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {credits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aún no tienes créditos desembolsados
              </p>
            ) : (
              <div className="divide-y divide-border">
                {credits.map((credit) => (
                  <CreditRow key={credit.id} credit={credit} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
