'use client';

/**
 * Wrapper del LoanCalculator para el portal autenticado.
 *
 * Soporta dos modos:
 * - Crear: sin initialValues → crea intención y navega a /solicitar/start
 * - Editar: con initialValues → actualiza intención en el store
 *
 * Después de un submit exitoso, actualiza el intencion-store directamente.
 * No necesita callbacks — cualquier componente suscrito al store se actualiza.
 */

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoanCalculatorProvider } from './core';
import { LoanCalculator } from './ui';
import { fondeaPortalApi, updateIntention } from './adapters/fondeaPortalApi';
import { useIntencionStore } from '@/lib/stores/intencion-store';
import { useScoreStore } from '@/lib/stores/score-store';
import { mapIntencionFromBackend } from '@/lib/mappers/intencion.mapper';
import type { LoanCalculatorApi, LoanCalculatorProps, IntentionRequest, IntentionResponse, LoanCalculatorTheme } from './core';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PortalInitialValues {
  /** ID de la intención existente — si viene, el submit hace PUT en lugar de POST */
  intencionId: string;
  amount: number;
  termDays: number;
  installmentCount: number;
}

interface LoanCalculatorPortalProps extends Omit<LoanCalculatorProps, 'submitLabel'> {
  /** Datos de la intención activa del usuario, si existe */
  initialValues?: PortalInitialValues;
  /** Callback opcional para cerrar el panel después del submit */
  onDone?: () => void;
}

// ── Theme por defecto (basado en la paleta del proyecto) ──────────────────────

const DEFAULT_PORTAL_THEME: LoanCalculatorTheme = {
  primary: 'var(--color-primary-500)',
  primaryDark: 'var(--color-primary-600)',
  primaryLight: 'var(--color-primary-50)',
  text: 'var(--color-neutral-800)',
  muted: 'var(--color-neutral-500)',
  border: 'var(--color-neutral-200)',
  background: '#FFFFFF',
  headerBg: 'var(--color-primary-500)',
  headerText: '#FFFFFF',
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function LoanCalculatorPortal({
  initialValues,
  onDone,
  ...calcProps
}: LoanCalculatorPortalProps) {
  const router = useRouter();
  const setIntencion = useIntencionStore(s => s.setIntencion);
  const score = useScoreStore(s => s.puntaje);
  const fetchScore = useScoreStore(s => s.fetchPuntaje);
  const isEditing = !!initialValues?.intencionId;

  // Cargar score al montar (si no se cargó antes)
  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const portalApi: LoanCalculatorApi = useMemo(() => ({
    ...fondeaPortalApi,
    createIntention: async (data: IntentionRequest): Promise<IntentionResponse> => {
      // ── Validar límite de puntaje ──
      if (score && data.amount > score.maxLoanAmount) {
        toast.error(
          `El monto S/ ${data.amount.toLocaleString('es-PE')} excede tu límite de S/ ${score.maxLoanAmount.toLocaleString('es-PE')}`
        );
        throw new Error('LIMIT_EXCEEDED');
      }

      // Crear la promesa real
      const promise = isEditing
        ? updateIntention(initialValues!.intencionId, data.amount, data.termDays, data.installmentCount)
        : fondeaPortalApi.createIntention(data);

      // Toast observa la promesa (no modifica el resultado)
      toast.promise(promise, {
        loading: isEditing ? 'Actualizando solicitud...' : 'Creando solicitud...',
        success: isEditing ? 'Solicitud actualizada' : 'Solicitud creada',
        error: 'Error al procesar la solicitud',
      });

      // Awaitar el resultado real para Zustand
      const result = await promise;

      // ── Separar actualizaciones para evitar race condition DOM ──
      // Paso 1: Actualizar el store (causa re-render del sidebar)
      setIntencion(mapIntencionFromBackend(result));

      // Paso 2: Cerrar panel / navegar en el SIGUIENTE frame
      // Esto permite que React reconcilie el sidebar primero,
      // antes de desmontar el panel (evita insertBefore error).
      await new Promise(resolve => requestAnimationFrame(resolve));

      if (onDone) {
        onDone();
      } else {
        router.push('/solicitar/start');
      }

      return result;
    },
    portalUrl: "__handled_internally__",
  }), [isEditing, initialValues, setIntencion, onDone, router, score]);

  return (
    <LoanCalculatorProvider api={portalApi} theme={DEFAULT_PORTAL_THEME}>
      <LoanCalculator
        {...calcProps}
        submitLabel={isEditing ? 'Guardar cambios →' : 'Solicitar Préstamo →'}
        initialSelection={initialValues ? {
          amount: initialValues.amount,
          termDays: initialValues.termDays,
          installmentCount: initialValues.installmentCount,
        } : undefined}
      />
    </LoanCalculatorProvider>
  );
}
