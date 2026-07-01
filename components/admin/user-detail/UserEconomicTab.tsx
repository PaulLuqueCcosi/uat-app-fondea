import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, GraduationCap, Home, Car } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserEconomicTabProps {
  forms: any;
}

export function UserEconomicTab({ forms }: UserEconomicTabProps) {
  const economic = forms?.economic;

  if (!economic) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no ha completado su perfil económico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Perfil Económico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Gastos mensuales" value={economic.monthlyExpenses} type="money" />
            <ReadOnlyField label="Obligaciones financieras" value={economic.financialObligations} type="money" />
            <ReadOnlyField label="Otros ingresos" value={economic.otherIncome} type="money" />
            <ReadOnlyField label="Dependientes" value={economic.dependents} />
            <ReadOnlyField label="Nivel educativo" value={economic.educationLevel} />
            <ReadOnlyField label="Propósito del préstamo" value={economic.loanPurpose} colSpan={2} />
            <ReadOnlyField label="Propiedades" value={economic.properties} />
            <ReadOnlyField label="Vehículos" value={economic.vehicles} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
