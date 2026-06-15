import type { PassportLevel } from '@/modules/passport';

interface PassportCoverPageProps {
  currentLevel: PassportLevel;
  points: number;
}

// Código MRZ-style derivado del nombre del nivel (solo decorativo)
function mrzCode(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '<');
}

/**
 * Portada del pasaporte — logo, título, nivel actual, MRZ decorativo.
 */
export function PassportCoverPage({ currentLevel, points }: PassportCoverPageProps) {
  const code = mrzCode(currentLevel.name).padEnd(20, '<').slice(0, 20);

  return (
    <div className="h-full bg-primary-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Textura de fondo tipo papel de seguridad */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 14px)`,
          color: '#ffffff',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0%, transparent 60%, currentColor 60.5%, transparent 61%)`,
          backgroundSize: '24px 24px',
          color: '#ffffff',
        }}
      />

      {/* Banda superior */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />

      {/* Etiqueta superior tipo "PASSPORT" */}
      <p className="absolute top-5 left-0 right-0 text-center text-[8px] tracking-[0.35em] uppercase text-white/25">
        República · Crediticia
      </p>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-5 bg-white/10">
          <img src="/logo.png" alt="Fondea" className="w-11 h-11 object-contain" />
        </div>

        <p className="text-[9px] tracking-[0.15em] uppercase text-white/50 mb-1">Fondea Fintech</p>
        <h2 className="text-lg font-semibold text-white text-center mb-1">Pasaporte Financiero</h2>
        <p className="text-[11px] text-white/50 mb-6">Documento de identidad crediticia</p>

        <div className="px-4 py-2 rounded-full border border-white/20 bg-white/5">
          <p className="text-xs text-white/80">Nivel: <span className="font-bold text-white">{currentLevel.name}</span></p>
        </div>

        <p className="text-[11px] text-white/30 mt-3">{points} puntos acumulados</p>
      </div>

      {/* ─── MRZ inferior ─── */}
      <div className="absolute bottom-3 left-3 right-3 font-mono text-[6px] text-white/15 leading-relaxed">
        <p>P&lt;PER&lt;FINANCIERO&lt;&lt;PASAPORTE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
        <p>00247813&lt;0PER&lt;{code}&lt;&lt;&lt;{points}PTS&lt;&lt;</p>
      </div>

      {/* Banda inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />
    </div>
  );
}