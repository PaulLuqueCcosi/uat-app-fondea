import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DollarSign, MapPin, Phone } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserLaborTabProps {
  forms: any;
}

export function UserLaborTab({ forms }: UserLaborTabProps) {
  const labor = forms?.labor;

  if (!labor) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no ha completado su perfil laboral.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Información Laboral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Tipo de empleo" value={labor.employmentType} />
            <ReadOnlyField label="Empresa / Negocio" value={labor.company} />
            <ReadOnlyField label="Cargo" value={labor.position} />
            <ReadOnlyField label="Ingreso mensual" value={labor.monthlyIncome} type="money" />
            <ReadOnlyField label="Antigüedad" value={labor.seniority} />
            <ReadOnlyField label="RUC" value={labor.ruc} />
            <ReadOnlyField label="RUC validado (SUNAT)" value={labor.rucValidated} type="badge" badgeVariant={labor.rucValidated ? 'success' : 'warning'} />
            <ReadOnlyField label="Teléfono trabajo" value={labor.workPhone} />
            <ReadOnlyField label="Dirección trabajo" value={labor.workAddress} colSpan={2} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
