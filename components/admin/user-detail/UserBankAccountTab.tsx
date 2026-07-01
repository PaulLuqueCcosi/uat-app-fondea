import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, CreditCard, ShieldCheck } from 'lucide-react';
import { ReadOnlyField } from './ReadOnlyField';

interface UserBankAccountTabProps {
  forms: any;
}

export function UserBankAccountTab({ forms }: UserBankAccountTabProps) {
  const bank = forms?.bankAccount;

  if (!bank) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">El usuario aún no ha agregado su cuenta bancaria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Cuenta Bancaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Banco" value={bank.bank} />
            <ReadOnlyField label="Número de cuenta" value={bank.accountNumber} />
            <ReadOnlyField label="Tipo de cuenta" value={bank.accountType} />
            <ReadOnlyField label="CCI" value={bank.cci} />
            <ReadOnlyField label="Titular" value={bank.holderName} />
            <ReadOnlyField label="Validado" value={bank.validated} type="badge" badgeVariant={bank.validated ? 'success' : 'warning'} />
            {bank.validated && (
              <ReadOnlyField label="Fecha validación" value={bank.validationDate ? new Date(bank.validationDate).toLocaleDateString('es-PE') : null} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
