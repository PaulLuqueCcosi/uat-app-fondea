'use client';

import { useState } from 'react';
import { VPNBlockModal } from './VPNBlockModal';
import { Button } from '@/components/ui/button';

/**
 * Componente de demostración para previsualizar los 4 tipos de modal de bloqueo.
 * Útil para ver cómo se ve cada caso sin tener que activar la detección real.
 */
export function VPNBlockModalDemo() {
  const [openModal, setOpenModal] = useState<string | null>(null);

  const cases = [
    {
      id: 'vpn',
      label: 'VPN detectada',
      reasons: ['ProxyCheck: VPN detectado'],
    },
    {
      id: 'tor',
      label: 'TOR detectado',
      reasons: ['ProxyCheck: Tor detectado'],
    },
    {
      id: 'proxy',
      label: 'Proxy detectado',
      reasons: ['ProxyCheck: Proxy detectado'],
    },
    {
      id: 'sospechoso',
      label: 'Conexión sospechosa',
      reasons: ['ProxyCheck: Risk score alto (75 >= 65)'],
    },
  ];

  const activeCase = cases.find((c) => c.id === openModal);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Demostración de modales de bloqueo</h2>
      <p className="text-sm text-muted-foreground">
        Haz clic en cada botón para ver cómo se ve el modal en cada caso.
      </p>

      <div className="flex flex-wrap gap-3">
        {cases.map((c) => (
          <Button
            key={c.id}
            variant={c.id === 'tor' ? 'destructive' : 'outline'}
            onClick={() => setOpenModal(c.id)}
          >
            Ver: {c.label}
          </Button>
        ))}
      </div>

      {activeCase && (
        <VPNBlockModal
          open={true}
          onClose={() => setOpenModal(null)}
          reasons={activeCase.reasons}
        />
      )}
    </div>
  );
}
