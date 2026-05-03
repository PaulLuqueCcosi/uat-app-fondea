import { Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Calculadora de préstamos.
 * Permite al usuario elegir monto y plazo antes de iniciar el funnel.
 *
 * TODO: implementar la calculadora interactiva con createIntencion()
 */
export default function CalculadoraPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Calculator className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Calculadora de préstamo</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aquí podrás elegir el monto y plazo de tu préstamo antes de continuar con tu solicitud.
          </p>
          <p className="text-xs text-muted-foreground/60">Próximamente disponible</p>
        </CardContent>
      </Card>
    </div>
  );
}
