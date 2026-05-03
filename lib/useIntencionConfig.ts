'use client';

import { useEffect, useState } from 'react';
import { getIntencionConfig } from '@/app/actions/intencion.actions';
import type { IntencionConfig } from './types';

const STORAGE_KEY = 'fondea_intencion_config';

function saveConfig(config: IntencionConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

function loadConfig(): IntencionConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IntencionConfig) : null;
  } catch {
    return null;
  }
}

function clearConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Hook que obtiene y persiste la configuración del préstamo asociada
 * a la intención de la landing.
 *
 * Prioridad:
 * 1. Si hay config en localStorage con el mismo intencionId → la usa directamente
 * 2. Si no, llama al server action y guarda el resultado
 *
 * Esto evita llamadas repetidas al backend mientras el usuario navega
 * entre pasos del funnel.
 */
export function useIntencionConfig(): {
  config: IntencionConfig | null;
  loading: boolean;
} {
  const [config, setConfig] = useState<IntencionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Llamar directamente al server action — sin depender de localStorage
    // El backend identifica al usuario por su token y retorna su intención activa
    getIntencionConfig('active')
      .then((data) => {
        if (data) {
          setConfig(data);
          // Sincronizar localStorage como efecto secundario
          saveConfig(data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fondea_intencion_id', data.intencionId);
          }
        }
      })
      .catch((err) => {
        console.error('[useIntencionConfig] Error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { config, loading };
}
