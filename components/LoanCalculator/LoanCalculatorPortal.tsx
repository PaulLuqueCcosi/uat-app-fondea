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

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LoanCalculatorProvider } from './core';
import { LoanCalculator } from './ui';
import { fondeaPortalApi, updateIntention } from './adapters/fondeaPortalApi';
import { useIntencionStore } from '@/lib/stores/intencion-store';
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
  const refetchIntencion = useIntencionStore(s => s.refetch);
  const isEditing = !!initialValues?.intencionId;

  const portalApi: LoanCalculatorApi = useMemo(() => ({
    ...fondeaPortalApi,
    createIntention: async (data: IntentionRequest): Promise<IntentionResponse> => {
      let result: IntentionResponse;

      if (isEditing) {
        // Modo editar: PUT a la intención existente
        result = await updateIntention(
          initialValues!.intencionId,
          data.amount,
          data.termDays,
          data.installmentCount,
        );
      } else {
        // Modo crear: POST nueva intención
        result = await fondeaPortalApi.createIntention(data);
      }

      // Después del éxito, obtener la intención actualizada del backend
      // (datos completos con toda la lógica del backend aplicada)
      await refetchIntencion();

      // Post-submit: cerrar panel o navegar
      if (onDone) {
        onDone();
      } else {
        router.push('/solicitar/start');
      }

      return result;
    },
    portalUrl: "__handled_internally__",
  }), [isEditing, initialValues, refetchIntencion, onDone, router]);

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
