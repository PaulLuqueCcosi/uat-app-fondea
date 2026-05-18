'use client';

/**
 * Wrapper del LoanCalculator para el portal autenticado.
 *
 * Soporta dos modos:
 * - Crear: sin initialValues → llama a createIntencion y navega a /solicitar/start
 * - Editar: con initialValues → llama a updateIntencion y ejecuta onSubmitSuccess
 *
 * A diferencia del LoanCalculatorWithProvider (landing), este:
 * - Usa las API routes autenticadas (/api/intenciones)
 * - Pre-llena la calculadora con los valores de la intención activa
 * - No redirige a una URL externa
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LoanCalculatorProvider } from './core';
import { LoanCalculator } from './ui';
import { fondeaPortalApi, updateIntention } from './adapters/fondeaPortalApi';
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
  /**
   * Callback después de un submit exitoso.
   * Si se proporciona, se llama en lugar de navegar a /solicitar/start.
   * Útil para el modal inline donde no queremos salir de la página.
   */
  onSubmitSuccess?: () => void;
}

// ── Theme por defecto (basado en la paleta del proyecto) ──────────────────────

const DEFAULT_PORTAL_THEME: LoanCalculatorTheme = {
  primary: 'var(--color-primary-500)',      // #00A1CD
  primaryDark: 'var(--color-primary-600)',  // #0087AD
  primaryLight: 'var(--color-primary-50)',  // #E0F7FD
  text: 'var(--color-neutral-800)',         // #2D373D
  muted: 'var(--color-neutral-500)',        // #7A8E9A
  border: 'var(--color-neutral-200)',       // #DDE4EA
  background: '#FFFFFF',                    // Blanco
  headerBg: 'var(--color-primary-500)',     // #00A1CD
  headerText: '#FFFFFF',                    // Blanco
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function LoanCalculatorPortal({
  initialValues,
  onSubmitSuccess,
  ...calcProps
}: LoanCalculatorPortalProps) {
  const router = useRouter();
  const isEditing = !!initialValues?.intencionId;

  // Construir un adapter que intercepta createIntention para manejar
  // la lógica de crear vs editar + navegación post-submit
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

      // Navegación post-submit
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push('/solicitar/start');
      }

      return result;
    },
    // Sobreescribir portalUrl para que el componente no haga redirect externo
    // El redirect lo manejamos arriba en createIntention
    portalUrl: "__handled_internally__",
  }), [isEditing, initialValues, onSubmitSuccess, router]);

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
