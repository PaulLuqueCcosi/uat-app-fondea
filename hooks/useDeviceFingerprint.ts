'use client';

import { useState, useCallback } from 'react';
import { collectFingerprint, logFingerprint, type FingerprintResult } from '@/lib/client-api/device-fingerprint';

interface UseDeviceFingerprintReturn {
  fingerprint: FingerprintResult | null;
  loading: boolean;
  error: string | null;
  collect: () => Promise<FingerprintResult | null>;
  collectWithGPSPrompt: () => Promise<FingerprintResult | null>;
}

export function useDeviceFingerprint(): UseDeviceFingerprintReturn {
  const [fingerprint, setFingerprint] = useState<FingerprintResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const collect = useCallback(async (): Promise<FingerprintResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const fp = await collectFingerprint();
      setFingerprint(fp);
      logFingerprint(fp); // Loguea automáticamente en consola
      return fp;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al recolectar fingerprint';
      setError(msg);
      console.error('[useDeviceFingerprint]', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Igual que collect pero fuerza un prompt de GPS si no se obtuvo.
   * El resultado incluirá gps=null si el usuario rechazó.
   */
  const collectWithGPSPrompt = useCallback(async (): Promise<FingerprintResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const fp = await collectFingerprint();
      setFingerprint(fp);
      logFingerprint(fp);
      return fp;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al recolectar fingerprint';
      setError(msg);
      console.error('[useDeviceFingerprint]', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fingerprint, loading, error, collect, collectWithGPSPrompt };
}
