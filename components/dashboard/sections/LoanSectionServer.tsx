import { ArrowRight, Plus, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getActiveIntencion } from '@/app/actions/intencion.actions';

export async function LoanSectionServer() {
  // Obtener datos reales del servidor
  const activeIntencion = await getActiveIntencion();

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          activeIntencion ? 'bg-primary' : 'bg-border'
        )}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-semibold text-dark">
          {activeIntencion ? 'Tu Préstamo' : 'Solicitar Préstamo'}
        </h2>
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        {activeIntencion ? (
          <>
            {/* Resumen de la intención activa */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">Monto</span>
              <span className="font-semibold text-dark">
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(activeIntencion.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">Plazo</span>
              <span className="font-semibold text-dark">{activeIntencion.termDays} días</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-fondea-text">Cuotas</span>
              <span className="font-semibold text-dark">{activeIntencion.installmentCount}</span>
            </div>
            <div className="border-t border-border my-1" />
            <a
              href="/solicitar/start"
              className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Continuar solicitud
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/dashboard/calculadora"
              className="w-full flex items-center justify-between text-sm text-primary font-medium border border-border rounded-lg px-4 py-2.5 hover:bg-primary-50 transition-colors"
            >
              <span>Nuevo préstamo</span>
              <Plus className="w-4 h-4" />
            </a>
          </>
        ) : (
          <>
            <p className="text-sm text-fondea-text">
              Configura el monto y plazo de tu préstamo para comenzar.
            </p>
            <a
              href="/dashboard/calculadora"
              className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Pedir préstamo
            </a>
          </>
        )}
      </div>
    </Card>
  );
}
