'use client';

import { MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LocationDeclinedModalProps {
  open: boolean;
  onRetry: () => void;
  onContinue: () => void;
}

export function LocationDeclinedModal({ open, onRetry, onContinue }: LocationDeclinedModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onContinue()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center text-lg">
            Ubicación no compartida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button onClick={onContinue} variant="default" className="w-full">
            Continuar sin ubicación
          </Button>
          <Button onClick={onRetry} variant="outline" className="w-full">
            Intentar de nuevo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
