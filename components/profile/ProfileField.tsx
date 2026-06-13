import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardAction } from '@/components/ui/card';

/**
 * ProfileField — Card reutilizable para mostrar un dato del perfil.
 * Solo renderiza. No tiene lógica.
 */
interface ProfileFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ProfileField({ icon, label, value, action, footer }: ProfileFieldProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {value}
      </CardContent>
      {footer && <CardFooter className="text-xs text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}
