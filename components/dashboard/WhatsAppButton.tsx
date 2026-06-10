'use client';

import { MessageCircle } from 'lucide-react';

/**
 * Botón flotante de WhatsApp — Soporte rápido.
 * Al hacer clic abre WhatsApp con un mensaje predefinido.
 *
 * TODO: Reemplazar número con el número real de soporte.
 */

const WHATSAPP_NUMBER = '51999999999'; // Número de soporte FONDEA
const WHATSAPP_MESSAGE = 'Hola, necesito ayuda con mi préstamo en FONDEA.';

export function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg hover:bg-[#20BD5A] transition-colors group"
      aria-label="Contactar soporte por WhatsApp"
    >
      <MessageCircle className="w-5 h-5 fill-white" />
      <span className="text-sm font-medium hidden sm:inline group-hover:inline">
        Soporte
      </span>
    </a>
  );
}
