import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Mail, MapPin, Phone, Shield, User } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserProfileTabProps {
  user: any;
  forms: any;
}

export function UserProfileTab({ user, forms }: UserProfileTabProps) {
  const kyc = forms?.kyc;
  const address = forms?.address;

  return (
    <div className="space-y-4">
      {/* Datos Personales */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Nombre completo" value={user?.name} />
            <ReadOnlyField label="DNI" value={user?.dni} />
            <ReadOnlyField label="Email" value={user?.email} />
            <ReadOnlyField label="Teléfono" value={user?.phone} />
            <ReadOnlyField label="Fecha de registro" value={user?.registeredAt ? new Date(user.registeredAt).toLocaleDateString('es-PE') : null} />
            <ReadOnlyField label="Estado" value={user?.status === 'active' ? 'Activo' : 'Bloqueado'} type="badge" badgeVariant={user?.status === 'active' ? 'success' : 'error'} />
          </div>
        </CardContent>
      </Card>

      {/* KYC */}
      {kyc && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Identidad (KYC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Nombres" value={kyc.firstName} />
              <ReadOnlyField label="Apellidos" value={kyc.lastName} />
              <ReadOnlyField label="DNI" value={kyc.dni} />
              <ReadOnlyField label="Fecha de nacimiento" value={kyc.birthDate} />
              <ReadOnlyField label="Nacionalidad" value={kyc.nationality} />
              <ReadOnlyField label="Género" value={kyc.gender} />
              <ReadOnlyField label="Validado" value={kyc.validated} type="badge" badgeVariant={kyc.validated ? 'success' : 'warning'} />
              {kyc.validated && (
                <>
                  <ReadOnlyField label="Fecha validación" value={kyc.validationDate ? new Date(kyc.validationDate).toLocaleDateString('es-PE') : null} />
                  <ReadOnlyField label="Fuente" value={kyc.validationSource} type="badge" />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dirección */}
      {address && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Dirección
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
      )}

      {/* Sin datos */}
      {!kyc && !address && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">El usuario aún no ha completado su perfil.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
