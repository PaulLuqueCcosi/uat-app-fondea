'use client';

import { useCallback, useRef, useState } from 'react';
import { getNegotiationOfferByIdAction } from '@/app/actions/negotiation-offer.actions';
import type { NegotiationOffer } from '@/modules/negotiation-offers';

/**
 * Polling acotado para esperar la creación del crédito de negociación
 * tras firmar una oferta.
 *
 * Por qué polling acotado y no "confía y refresca al volver":
 * la creación del crédito es un paso asíncrono que en la práctica es casi
 * instantáneo (todo pasa en el mismo proceso, sin gateway externo de por
 * medio). Pero si falla después de la firma, HOY no existe un scheduler de
 * detección de "huérfanos" para créditos de negociación (sí existe para
 * créditos normales — limitación de alcance conocida en el backend). Si
 * confiáramos en "el usuario vuelve a entrar y ya está", un fallo silencioso
 * lo deja mirando "procesando..." indefinidamente sin saber si debe esperar
 * o contactar soporte.
 *
 * Estrategia: pollear cada 2s durante ~20s (10 intentos). Si no aparece
 * `resultingCreditId` en ese lapso, se reporta `timedOut = true` para que
 * la UI muestre un estado distinto ("esto está tardando más de lo normal").
 * Caso feliz: 1-2 polls, cero costo extra.
 */

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 10; // ~20s

type PollingState = 'idle' | 'polling' | 'resolved' | 'timed-out' | 'error';

interface UseNegotiationOfferPollingResult {
  state: PollingState;
  resultingCreditId: string | null;
  /** Inicia el polling para la oferta indicada */
  start: (offerId: string) => void;
}

export function useNegotiationOfferPolling(): UseNegotiationOfferPollingResult {
  const [state, setState] = useState<PollingState>('idle');
  const [resultingCreditId, setResultingCreditId] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const start = useCallback((offerId: string) => {
    cancelledRef.current = false;
    setState('polling');
    setResultingCreditId(null);

    let attempt = 0;

    const poll = async () => {
      if (cancelledRef.current) return;
      attempt += 1;

      const result = await getNegotiationOfferByIdAction(offerId);
      if (cancelledRef.current) return;

      if (!result.ok) {
        setState('error');
        return;
      }

      const offer: NegotiationOffer = result.data.offer;
      if (offer.resultingCreditId) {
        setResultingCreditId(offer.resultingCreditId);
        setState('resolved');
        return;
      }

      if (attempt >= MAX_ATTEMPTS) {
        setState('timed-out');
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, POLL_INTERVAL_MS);
  }, []);

  return { state, resultingCreditId, start };
}
