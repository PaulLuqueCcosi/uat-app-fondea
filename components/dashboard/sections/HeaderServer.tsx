import { ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUser } from '@/app/actions/auth.actions';
import { getActiveIntencion } from '@/app/actions/intencion.actions';

export async function HeaderServer() {
  // Obtener datos reales del servidor
  const [user, intencionResult] = await Promise.all([
    getUser(),
    getActiveIntencion(),
  ]);

  const userName = user?.name || 'Usuario';
  const activeIntencion = intencionResult.ok ? intencionResult.data : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-1">Hola, {userName}</h1>
        <p className="text-sm sm:text-base text-fondea-text">
          {activeIntencion
            ? 'Tienes una solicitud en curso. Continúa donde lo dejaste.'
            : 'Completa tu expediente para solicitar tu primer préstamo'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {activeIntencion && (
          <a
            href="/solicitar/start"
            className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            Continuar solicitud
          </a>
        )}
        <a
          href="/dashboard/calculadora"
          className={cn(
            'flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap text-sm',
            activeIntencion
              ? 'border border-primary/30 text-primary hover:bg-primary/5'
              : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl',
          )}
        >
          <Plus className="w-4 h-4" />
          {activeIntencion ? 'Nuevo préstamo' : 'Pedir préstamo'}
        </a>
      </div>
    </div>
  );
}
