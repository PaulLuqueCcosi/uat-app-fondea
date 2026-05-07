/**
 * LoadingScreen — Componente reutilizable de pantalla de carga.
 *
 * Spinner con gradiente de marca (primary-500 → accent-600)
 * sobre fondo de página.
 *
 * @example
 * <LoadingScreen message="Verificando sesión..." />
 * <LoadingScreen message="Preparando tu solicitud..." />
 */

interface LoadingScreenProps {
  /** Texto que se muestra debajo del spinner */
  message?: string;
}

export function LoadingScreen({ message = 'Cargando...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Spinner */}
      <div className="relative w-10 h-10 mb-4">
        {/* Track: primary-100 */}
        <div className="absolute inset-0 rounded-full border-[3px] border-primary-100" />
        {/* Arco animado: gradiente primary-500 → accent-600 */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          viewBox="0 0 40 40"
          fill="none"
        >
          <circle
            cx="20"
            cy="20"
            r="17.5"
            stroke="url(#loading-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 30"
          />
          <defs>
            <linearGradient id="loading-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--color-primary-500)" />
              <stop offset="1" stopColor="var(--color-accent-600)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Mensaje: neutral-600 sobre fondo página — ratio 6.2:1 AA */}
      <p className="text-sm text-neutral-600">
        {message}
      </p>
    </div>
  );
}
