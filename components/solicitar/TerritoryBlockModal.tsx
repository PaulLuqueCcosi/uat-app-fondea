'use client';

import { MapPinOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TerritoryBlockModalProps {
  open: boolean;
  onClose: () => void;
  reasons: string[];
}

export function TerritoryBlockModal({ open, onClose, reasons }: TerritoryBlockModalProps) {
  const isGPSIssue = reasons.some(r => r.includes('GPS'));
  const isIPIssue = reasons.some(r => r.includes('IP'));

  let body: string;
  if (isIPIssue && isGPSIssue) {
    body = 'Tanto tu dirección IP como tu ubicación GPS indican que no te encuentras en Perú. Este servicio solo está disponible para usuarios en territorio peruano.';
  } else if (isGPSIssue) {
    body = 'Tu ubicación GPS indica que no te encuentras en territorio peruano. Este servicio solo está disponible para usuarios en Perú.';
  } else if (isIPIssue) {
    body = 'Tu dirección IP indica que no te encuentras en Perú. Este servicio solo está disponible para usuarios en territorio peruano.';
  } else {
    body = 'No pudimos verificar que te encuentres en territorio peruano. Este servicio solo está disponible para usuarios en Perú.';
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <MapPinOff className="w-7 h-7 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">
            Servicio no disponible en tu ubicación
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {body}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center">
          Si crees que esto es un error, verifica que no estés usando una VPN y que tu ubicación esté activada.
        </p>

        <div className="pt-2">
          <Button onClick={onClose} variant="outline" className="w-full">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
