'use client';

import { ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VPNBlockModalProps {
  open: boolean;
  onClose: () => void;
  reasons: string[];
}

function getSimpleMessage(reasons: string[]): { title: string; body: string } {
  const all = reasons.join(' ').toLowerCase();

  if (all.includes('tor')) {
    return {
      title: 'No se permite conexiones por TOR',
      body: 'Hemos detectado que estás usando una red TOR. Por seguridad, no se permiten solicitudes desde este tipo de conexiones.',
    };
  }

  if (all.includes('vpn')) {
    return {
      title: 'No se permite VPN',
      body: 'Hemos detectado que estás usando una VPN. Por seguridad, no se permiten solicitudes desde este tipo de conexiones.',
    };
  }

  if (all.includes('proxy')) {
    return {
      title: 'Conexión no permitida',
      body: 'Hemos detectado que estás usando un proxy. Por seguridad, no se permiten solicitudes desde este tipo de conexiones.',
    };
  }

  return {
    title: 'Su conexión es sospechosa',
    body: 'Hemos detectado actividad inusual en tu conexión. Inténtalo desde otro dispositivo o red.',
  };
}

export function VPNBlockModal({ open, onClose, reasons }: VPNBlockModalProps) {
  const msg = getSimpleMessage(reasons);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">
            {msg.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {msg.body}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <Button onClick={onClose} variant="outline" className="w-full">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
