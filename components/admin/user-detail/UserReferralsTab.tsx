import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Link } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserReferralsTabProps {
  referrals: any;
}

export function UserReferralsTab({ referrals }: UserReferralsTabProps) {
  if (!referrals) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario no tiene datos de referidos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            Programa de Referidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-mono font-bold text-primary">{referrals.code}</p>
              <p className="text-xs text-muted-foreground">Código</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{referrals.totalReferred}</p>
              <p className="text-xs text-muted-foreground">Referidos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-success-600">+{referrals.pointsEarned}</p>
              <p className="text-xs text-muted-foreground">Puntos ganados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
