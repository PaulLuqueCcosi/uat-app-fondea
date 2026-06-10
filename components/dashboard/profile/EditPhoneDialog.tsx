'use client';

import { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { updatePhone } from '@/lib/user/actions';

interface EditPhoneDialogProps {
  currentPhone: string;
}

export function EditPhoneDialog({ currentPhone }: EditPhoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updatePhone(newPhone);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Pencil className="w-3.5 h-3.5" />
        Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar número de celular</DialogTitle>
          <DialogDescription>
            Te enviaremos un código SMS al nuevo número para confirmar el cambio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="current-phone">Número actual</Label>
            <Input id="current-phone" value={currentPhone} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-phone">Nuevo número</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>+51</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="new-phone"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="999 999 999"
                autoFocus
              />
            </InputGroup>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={saving || !newPhone}
            className="gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Enviar código SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
