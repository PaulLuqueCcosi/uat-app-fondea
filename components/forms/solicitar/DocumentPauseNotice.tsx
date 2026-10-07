'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useSolicitudStore } from '@/lib/stores/solicitud-store';
import { formatDateTimePeru } from '@/modules/shared/backend-date';

const TICK_MS = 30_000;
/** Perú no tiene horario de verano: siempre UTC-5. */
const PERU_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Milisegundos que faltan hasta `until` (LocalDateTime de Perú sin zona, o instante con zona). */
function msUntil(until: string, nowMs: number): number {
  const text = until.trim();
  const wallClock = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (wallClock) {
    const [, y, mo, d, h, mi, s = '0'] = wallClock;
    return Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) + PERU_OFFSET_MS - nowMs;
  }
  const parsed = new Date(text).getTime();
  return Number.isNaN(parsed) ? 0 : parsed - nowMs;
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

/**
 * Estado de la pausa temporal de verificación de documentos.
 *
 * `paused` es hydration-safe: el tiempo restante solo se calcula tras el montaje; antes de eso,
 * si el store trae una pausa, se asume vigente (el store solo se llena en el cliente).
 */
export function useDocumentsPause() {
  const pause = useSolicitudStore((s) => s.documentsPause);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!pause) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [pause]);

  // Re-evaluar justo al vencer la pausa, sin esperar al siguiente tick de 30 s.
  useEffect(() => {
    if (!pause || now === null) return;
    const remaining = msUntil(pause.blockedUntil, Date.now());
    if (remaining <= 0 || remaining >= TICK_MS) return;
    const id = setTimeout(() => setNow(Date.now()), remaining + 250);
    return () => clearTimeout(id);
  }, [pause, now]);

  const remainingMs = pause && now !== null ? msUntil(pause.blockedUntil, now) : null;
  const paused = !!pause && (remainingMs === null || remainingMs > 0);
  const expired = !!pause && remainingMs !== null && remainingMs <= 0;

  return { pause, paused, expired, remainingMs };
}

/** Aviso ámbar de "última vida": solo cuando queda exactamente 1 intento tras un rechazo. */
export function LastAttemptWarning() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 border border-warning-100 text-warning-700">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-xs font-medium">
        Te queda un último intento. Si vuelve a fallar, tu solicitud se bloqueará temporalmente por 24 horas.
      </p>
    </div>
  );
}

/** Panel de "Verificación en pausa". Se renderiza solo mientras la pausa esté vigente. */
export function DocumentPauseNotice() {
  const { pause, paused, expired, remainingMs } = useDocumentsPause();
  const refresh = useSolicitudStore((s) => s.refreshDocumentsVerification);
  const refetched = useRef<string | null>(null);

  // Al llegar a cero: refrescar el estado y rehabilitar la UI sin recargar la página.
  useEffect(() => {
    if (!pause || !expired || refetched.current === pause.blockedUntil) return;
    refetched.current = pause.blockedUntil;
    void refresh();
  }, [pause, expired, refresh]);

  if (!pause || !paused) return null;

  return (
    <div
      role="status"
      className="mb-8 p-4 rounded-lg bg-warning-50 border border-warning-100 flex items-start gap-3"
    >
      <Clock className="w-5 h-5 text-warning-700 mt-0.5 shrink-0" />
      <div className="space-y-1.5">
        <h3 className="font-semibold text-sm text-warning-700">Verificación en pausa</h3>
        <p className="text-sm text-warning-700">
          Por seguridad, pausamos tu solicitud temporalmente tras varios intentos fallidos.
        </p>
        {pause.canContinueAt && !pause.expiresFirst ? (
          <>
            <p className="text-sm text-warning-700">
              Podrás continuar el <strong>{formatDateTimePeru(pause.canContinueAt)}</strong>
            </p>
            <p className="text-sm font-semibold text-warning-700" suppressHydrationWarning>
              {remainingMs === null ? 'Calculando tiempo restante…' : `Faltan ${formatCountdown(remainingMs)}`}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-warning-700">
              Tu pre-aprobación vence antes de que termine la pausa. Tendrás que generar una nueva solicitud.
            </p>
            <Link
              href="/dashboard"
              className={buttonVariants({ size: 'sm', variant: 'outline', className: 'mt-1' })}
            >
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
