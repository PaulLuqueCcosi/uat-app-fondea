'use client';

import { useState } from 'react';
import { X, TrendingUp, Clock, Award } from 'lucide-react';

/**
 * Alerta Estratégica (Nudge) — Banner debajo del header.
 * Solo aparece uno a la vez. Mensajes dinámicos que motivan
 * al usuario a pagar a tiempo o celebran su progreso.
 *
 * TODO: Conectar con datos reales del préstamo para elegir el mensaje.
 */

interface NudgeMessage {
  id: string;
  type: 'positive' | 'urgency' | 'info';
  icon: React.ReactNode;
  text: string;
}

// Mock: en producción esto vendrá del estado del préstamo
const mockNudge: NudgeMessage = {
  id: 'nudge-1',
  type: 'positive',
  icon: <TrendingUp className="w-4 h-4" />,
  text: '¡Estás a 1 pago de subir a Nivel Plata! Paga puntual y desbloquea un límite mayor.',
};

export function NudgeAlert() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const nudge = mockNudge;

  const bgStyles = {
    positive: 'bg-primary-50 border-primary-200 text-primary-900',
    urgency: 'bg-warning-50 border-warning-100 text-warning-900',
    info: 'bg-primary-50 border-primary-200 text-primary-900',
  };

  const iconStyles = {
    positive: 'text-primary',
    urgency: 'text-warning-500',
    info: 'text-primary',
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${bgStyles[nudge.type]}`}>
      <span className={iconStyles[nudge.type]}>{nudge.icon}</span>
      <p className="flex-1 text-sm font-medium">{nudge.text}</p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
        aria-label="Cerrar alerta"
      >
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
}
