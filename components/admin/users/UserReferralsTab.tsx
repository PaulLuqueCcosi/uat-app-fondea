'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ReferralStatus = 'REGISTERED' | 'ACTIVE' | 'LOAN_COMPLETED';

interface Referral {
  id: string;
  referredUserId: string;
  registeredAt: string;
  completedAt: string | null;
  status: ReferralStatus;
  pointsAwarded: number;
}

interface UserReferralsTabProps {
  code: string;
  totalReferred: number;
  pointsEarned: number;
  referrals: Referral[];
}

const statusConfig: Record<ReferralStatus, { label: string; variant: string }> = {
  REGISTERED: { label: 'Registrado', variant: 'secondary' },
  ACTIVE: { label: 'Activo', variant: 'warning' },
  LOAN_COMPLETED: { label: 'Completado', variant: 'success' },
};

const statusDescriptions: Record<ReferralStatus, string> = {
  REGISTERED: 'Se registró en la plataforma',
  ACTIVE: 'Tiene un crédito en curso',
  LOAN_COMPLETED: 'Completó su primer crédito',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function UserReferralsTab({ code, totalReferred, pointsEarned, referrals }: UserReferralsTabProps) {
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-mono font-bold text-primary text-lg">{code}</p>
            <p className="text-[10px] text-muted-foreground">Código de referido</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalReferred}</p>
            <p className="text-[10px] text-muted-foreground">Personas referidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success-600">+{pointsEarned}</p>
            <p className="text-[10px] text-muted-foreground">Puntos ganados</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Historial de referidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {referrals.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Este usuario no ha referido a nadie aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Descripción</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => {
                    const cfg = statusConfig[ref.status];
                    return (
                      <tr key={ref.id} className="border-b last:border-0">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {formatDate(ref.registeredAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={cfg.variant as any} className="text-[10px]">{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {statusDescriptions[ref.status]}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">
                          {ref.pointsAwarded > 0 ? (
                            <span className="text-success-600">+{ref.pointsAwarded}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
