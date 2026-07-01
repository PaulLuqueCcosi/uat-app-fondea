import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserAddressTabProps {
  forms: any;
}

export function UserAddressTab({ forms }: UserAddressTabProps) {
  const address = forms?.address;

  if (!address) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no ha completado su dirección.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Dirección Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Departamento" value={address.region} />
            <ReadOnlyField label="Provincia" value={address.province} />
            <ReadOnlyField label="Distrito" value={address.district} />
            <ReadOnlyField label="Dirección exacta" value={address.address} colSpan={2} />
            <ReadOnlyField label="Tipo de vivienda" value={address.housingType} />
            <ReadOnlyField label="Tiempo residiendo" value={address.timeAtAddress} />
            <ReadOnlyField label="Código postal" value={address.postalCode} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
