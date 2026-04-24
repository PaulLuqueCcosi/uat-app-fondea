'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function EvaluandoPage() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [dots, setDots] = useState('');

  // Simular polling de estado cada 10 segundos
  useEffect(() => {
    const checkStatus = async () => {
      // TODO: Implementar llamada real a la API
      // const status = await getApplicationStatus(solicitudId);

      // Por ahora simular evaluación de 3 minutos
      if (timeElapsed >= 180) { // 3 minutos
        // Simular resultado aleatorio para demo
        const randomResult = Math.random();

        if (randomResult > 0.7) {
          router.push(`/solicitudes/${solicitudId}/preaprobada`);
        } else if (randomResult > 0.4) {
          router.push(`/solicitudes/${solicitudId}/rechazada`);
        } else {
          router.push(`/solicitudes/${solicitudId}/mas-info`);
        }
      }
    };

    const interval = setInterval(checkStatus, 10000); // cada 10 segundos
    return () => clearInterval(interval);
  }, [solicitudId, router, timeElapsed]);

  // Timer de segundos transcurridos
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animación de puntos suspensivos
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icono animado */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="w-4 h-4 text-dark" />
            </div>
          </div>

          {/* Título */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Evaluando tu solicitud{dots}
            </h1>
            <p className="text-muted-foreground">
              Estamos analizando tu información. Esto puede tomar hasta 3 minutos.
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="w-full space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min((timeElapsed / 180) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tiempo transcurrido: {formatTime(timeElapsed)}</span>
              <span>Máx: 3:00</span>
            </div>
          </div>

          {/* Pasos del proceso */}
          <div className="w-full space-y-3 pt-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
              <span className="text-sm text-foreground">Verificación de identidad</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Loader2 className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
              <span className="text-sm text-foreground font-medium">Análisis crediticio en progreso</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-50">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Validación final</span>
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 w-full">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground text-left">
                <p className="font-semibold mb-1">Mientras esperas:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• No cierres esta ventana</li>
                  <li>• Asegúrate de tener buena conexión a internet</li>
                  <li>• En breve recibirás el resultado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
