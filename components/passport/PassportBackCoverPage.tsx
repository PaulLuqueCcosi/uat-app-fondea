/**
 * Contraportada del pasaporte — logo + tips de cómo ganar puntos.
 */
export function PassportBackCoverPage() {
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

      {/* Etiqueta superior */}
      <p className="absolute top-5 left-0 right-0 text-center text-[8px] tracking-[0.35em] uppercase text-white/25">
        Notas · Beneficios
      </p>

      <div className="relative z-10 flex flex-col items-center">
        <img src="/logo.png" alt="Fondea" className="w-14 h-14 object-contain mb-3 opacity-60" />
        <p className="text-sm text-white/40 mb-4">fondea.pe</p>
      </div>

      {/* ─── MRZ inferior ─── */}
      <div className="absolute bottom-3 left-3 right-3 font-mono text-[6px] text-white/15 leading-relaxed text-center">
        <p>&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
        <p>FONDEA&lt;FINTECH&lt;&lt;PERU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
      </div>

      {/* Banda inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent-500)_0px,var(--color-accent-500)_8px,transparent_8px,transparent_12px)]" />
    </div>
  );
}