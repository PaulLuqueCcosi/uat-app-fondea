'use client';

import { useState } from 'react';
import { LifeBuoy, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ─── Config ───────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '51999999999';

const SUPPORT_REASONS = [
  { id: 'payment', label: 'Problema con un pago' },
  { id: 'documents', label: 'Error al subir documentos' },
  { id: 'loan-info', label: 'Consulta de mi préstamo' },
  { id: 'loan-missing', label: 'No aparece mi préstamo' },
  { id: 'other', label: 'Otro motivo' },
] as const;

type ReasonId = (typeof SUPPORT_REASONS)[number]['id'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userDni?: string | null;
  userId?: string | null;
}

export function SupportDialog({ open, onOpenChange, userDni, userId }: SupportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReasonId | null>(null);
  const [description, setDescription] = useState('');

  const handleSend = () => {
    const reasonLabel = SUPPORT_REASONS.find((r) => r.id === selectedReason)?.label ?? 'No especificado';

    const parts = [
      '🆘 *Solicitud de Soporte FONDEA*',
      '',
      `📋 *Motivo:* ${reasonLabel}`,
    ];

    if (description.trim()) {
      parts.push(`📝 *Descripción:* ${description.trim()}`);
    }

    parts.push('');
    parts.push('── Datos de cuenta ──');
    if (userDni) parts.push(`🪪 *DNI:* ${userDni}`);
    if (userId) parts.push(`🆔 *ID:* ${userId}`);
    if (!userDni && !userId) parts.push('(datos no disponibles)');

    const message = encodeURIComponent(parts.join('\n'));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');

    // Reset
    setSelectedReason(null);
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary" />
            Soporte FONDEA
          </DialogTitle>
          <DialogDescription>
            Selecciona el motivo y te conectaremos con nuestro equipo por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Listado de motivos */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">¿Qué necesitas?</p>
            <div className="grid gap-1.5">
              {SUPPORT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                    selectedReason === reason.id
                      ? 'border-primary bg-primary/5 text-foreground font-medium'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Describe brevemente tu problema (opcional)
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntanos qué pasó..."
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!selectedReason}
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Enviar por WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── WhatsApp Icon ────────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
