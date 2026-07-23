import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import type { AdminCreditFullDetail } from '@/modules/admin/admin-credit-detail.service';

interface CreditClientCardProps {
  data: AdminCreditFullDetail;
}

export function CreditClientCard({ data }: CreditClientCardProps) {
  const client = data.client;
  if (!client) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" /> Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium">{client.full_name ?? 'Sin nombre'}</p>
            {client.document_number && (
              <p className="text-xs text-muted-foreground font-mono">DNI {client.document_number}</p>
            )}
            <div className="flex items-center gap-3 pt-1">
              {client.fondea_score != null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Score: <span className="font-mono font-medium text-foreground">{client.fondea_score}</span>
                </div>
              )}
              {client.passport_points != null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3 w-3" />
                  Pasaporte: <span className="font-mono font-medium text-foreground">{client.passport_points} pts</span>
                </div>
              )}
            </div>
          </div>
          <Link href={`/admin/users/${client.user_id}`}>
            <Badge variant="outline" className="cursor-pointer">Ver perfil</Badge>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
