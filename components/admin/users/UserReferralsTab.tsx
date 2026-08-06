import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, UserCheck, Users, ChevronRight } from 'lucide-react';
import type { ReferralUseStatus } from '@/modules/admin';

interface ReferrerDisplay {
  userId: string;
  name: string | null;
  documentNumber: string | null;
  status: ReferralUseStatus;
  appliedAtDisplay: string;
}

interface ReferralDisplay {
  id: string;
  referredUserId: string;
  referredName: string | null;
  referredDocumentNumber: string | null;
  referredRegisteredAtDisplay: string | null;
  status: ReferralUseStatus;
  createdAtDisplay: string;
  completedAtDisplay: string | null;
}

interface UserReferralsTabProps {
  code: string;
  totalReferred: number;
  totalCompleted: number;
  referredBy: ReferrerDisplay | null;
  referrals: ReferralDisplay[];
}

const statusConfig: Record<ReferralUseStatus, { label: string; variant: 'secondary' | 'success' }> = {
  REGISTERED: { label: 'Registrado', variant: 'secondary' },
  LOAN_COMPLETED: { label: 'Completó su crédito', variant: 'success' },
};

function PersonLink({ userId, name, documentNumber }: { userId: string; name: string | null; documentNumber: string | null }) {
  return (
    <Link href={`/admin/users/${userId}`} className="group inline-flex items-center gap-1.5 hover:underline">
      <span className="text-sm font-medium text-primary">
        {name ?? 'Usuario sin nombre'}
      </span>
      <span className="text-[11px] text-muted-foreground font-mono">
        {documentNumber ? `· DNI ${documentNumber}` : `· ${userId.slice(0, 8)}…`}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export function UserReferralsTab({ code, totalReferred, totalCompleted, referredBy, referrals }: UserReferralsTabProps) {
  return (
    <div className="space-y-4">
      {/* Código propio y resumen */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Programa de referidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Código propio</p>
              <p className="text-xl font-bold font-mono text-primary">{code}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Personas referidas</p>
              <p className="text-2xl font-bold">{totalReferred}</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${totalCompleted > 0 ? 'bg-success-50' : 'bg-muted/50'}`}>
              <p className="text-[11px] text-muted-foreground">Completaron su crédito</p>
              <p className={`text-2xl font-bold ${totalCompleted > 0 ? 'text-success-700' : ''}`}>{totalCompleted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quién lo refirió a él */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            Quién lo refirió
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referredBy ? (
            <div className="rounded-lg border p-3 flex items-center justify-between">
              <PersonLink userId={referredBy.userId} name={referredBy.name} documentNumber={referredBy.documentNumber} />
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={statusConfig[referredBy.status].variant}>
                  {statusConfig[referredBy.status].label}
                </Badge>
                <span className="text-xs text-muted-foreground">Aplicó el código: {referredBy.appliedAtDisplay}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Este usuario se registró directamente, sin usar el código de otra persona.
            </p>
          )}
        </CardContent>
      </Card>

      {/* A quiénes refirió */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Personas referidas
            <span className="text-xs font-normal text-muted-foreground">({referrals.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Este usuario no ha referido a nadie aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-0">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground first:pl-0">Persona</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Se registró</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Aplicó código</th>
                    <th className="text-left px-2 py-1.5 font-medium text-muted-foreground last:pr-0">Completó crédito</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => {
                    const cfg = statusConfig[ref.status];
                    return (
                      <tr key={ref.id} className="border-b last:border-0">
                        <td className="px-2 py-2 first:pl-0">
                          <PersonLink userId={ref.referredUserId} name={ref.referredName} documentNumber={ref.referredDocumentNumber} />
                        </td>
                        <td className="px-2 py-2">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {ref.referredRegisteredAtDisplay ?? '—'}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {ref.createdAtDisplay}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground last:pr-0">
                          {ref.completedAtDisplay ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
