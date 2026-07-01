import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, UserCheck, Users } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserReferencesTabProps {
  forms: any;
}

export function UserReferencesTab({ forms }: UserReferencesTabProps) {
  const references = forms?.references || [];

  if (references.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no ha agregado referencias.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {references.map((ref: any, index: number) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {ref.type === 'family' ? (
                <Users className="h-4 w-4 text-primary" />
              ) : (
                <UserCheck className="h-4 w-4 text-primary" />
              )}
              Referencia {index + 1} — {ref.type === 'family' ? 'Familiar' : 'No familiar'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Nombre" value={ref.name} />
              <ReadOnlyField label="Relación" value={ref.relationship} />
              <ReadOnlyField label="Teléfono" value={ref.phone} />
              <ReadOnlyField label="Verificado" value={ref.verified} type="badge" badgeVariant={ref.verified ? 'success' : 'warning'} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
