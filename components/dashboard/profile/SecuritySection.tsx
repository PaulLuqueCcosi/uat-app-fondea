'use client';

import {
  Lock,
  Link2,
  Globe,
  Trash2,
  Unlink,
  Pencil,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import type { UserSecurity } from '@/lib/user/types';

interface SecuritySectionProps {
  security: UserSecurity;
}

export function SecuritySection({ security }: SecuritySectionProps) {
  return (
    <div className="space-y-4">
      {/* Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Contraseña
          </CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" className="gap-1.5">
              {security.hasPassword ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {security.hasPassword ? 'Editar' : 'Agregar'}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {security.hasPassword ? (
            <p className="text-base font-medium text-foreground tracking-widest">••••••••••</p>
          ) : (
            <>
              <p className="text-base font-medium text-muted-foreground">Sin contraseña</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea una para iniciar sesión con email además de Google.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cuenta de Google */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Cuenta vinculada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {security.linkedAccounts.length > 0 ? (
            <div className="space-y-3">
              {security.linkedAccounts.map((account, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-foreground">{account.provider}</p>
                      <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                    </div>
                  </div>
                </div>
              ))}
              {security.hasPassword && (
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" size="sm" className="w-full gap-1.5 text-error-600 border-error-200 hover:bg-error-50" />}>
                    <Unlink className="w-3.5 h-3.5" />
                    Desvincular Google
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>¿Desvincular cuenta de Google?</DialogTitle>
                      <DialogDescription>
                        Ya no podrás iniciar sesión con Google. Solo podrás acceder con tu correo y contraseña.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Cancelar
                      </DialogClose>
                      <Button variant="destructive" className="gap-1.5">
                        <Unlink className="w-3.5 h-3.5" />
                        Confirmar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {!security.hasPassword && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Crea una contraseña antes de poder desvincular.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Sin cuentas vinculadas</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Vincular Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eliminar cuenta */}
      <Card className="border-error-200">
        <CardHeader>
          <CardTitle className="text-error-700 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Eliminar cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Se eliminarán todos tus datos permanentemente. Esta acción no se puede deshacer.
          </p>
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" size="sm" className="gap-1.5" />}>
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar mi cuenta
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>¿Estás seguro?</DialogTitle>
                <DialogDescription>
                  Esta acción es irreversible. Se eliminarán todos tus datos, historial y documentos.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button variant="destructive" className="gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Sí, eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
