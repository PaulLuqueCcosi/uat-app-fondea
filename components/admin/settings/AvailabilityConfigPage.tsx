'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger,
} from '@/components/ui/dialog';
import { MapPinOff, Clock, Plus, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminCitiesAction,
  createAdminCityAction,
  pauseAdminCityAction,
  activateAdminCityAction,
  getAdminBusinessHoursAction,
  updateAdminBusinessHoursAction,
} from '@/app/actions/admin-availability.actions';
import type { AdminCityAvailability, AdminBusinessHours } from '@/modules/admin/admin-availability.service';

/** "08:00:00" → "8:00 AM" */
function formatHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Página dedicada de M1 #58 — ciudades activas/pausadas + horario de
 * aceptación de solicitudes. Vive en /admin/settings/availability, igual
 * patrón que PenaltyConfigPage / DepositAccountPage / PassportRangesPage:
 * la card resumen en /admin/settings solo linkea acá.
 */
export function AvailabilityConfigPage() {
  return (
    <div className="space-y-6">
      <CitiesSection />
      <BusinessHoursSection />
    </div>
  );
}

// ── Ciudades ─────────────────────────────────────────────────────────────────

function CitiesSection() {
  const [isPending, startTransition] = useTransition();
  const [cities, setCities] = useState<AdminCityAvailability[] | null>(null);
  const [pauseDialogCity, setPauseDialogCity] = useState<AdminCityAvailability | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadCities(); }, []);

  async function loadCities() {
    const data = await getAdminCitiesAction();
    setCities(data.sort((a, b) => a.cityName.localeCompare(b.cityName)));
  }

  function handleToggle(city: AdminCityAvailability, nextActive: boolean) {
    if (!nextActive) {
      setPauseDialogCity(city);
      setPauseReason('');
      return;
    }
    startTransition(async () => {
      const result = await activateAdminCityAction(city.id);
      if (result.ok) {
        toast.success(`${city.cityName} ahora acepta nuevas solicitudes`);
        await loadCities();
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmPause() {
    if (!pauseDialogCity) return;
    const city = pauseDialogCity;
    startTransition(async () => {
      const result = await pauseAdminCityAction(city.id, pauseReason.trim() || undefined);
      if (result.ok) {
        toast.success(`${city.cityName} pausada — no aceptará nuevas solicitudes`);
        setPauseDialogCity(null);
        await loadCities();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createAdminCityAction({ ubigeoProvinceCode: newCode.trim(), cityName: newName.trim() });
      if (result.ok) {
        setCreateDialogOpen(false);
        setNewCode('');
        setNewName('');
        toast.success(`${result.data.cityName} registrada`);
        await loadCities();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPinOff className="h-4 w-4 text-primary" /> Ciudades Activas
            </CardTitle>
            <CardDescription>
              Pausa una ciudad para dejar de aceptar nuevas solicitudes (ej: NPL local muy alto)
            </CardDescription>
          </div>
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => { setError(null); setCreateDialogOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> Agregar ciudad
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {cities === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : cities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sin ciudades registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ciudad</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Código ubigeo</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Acepta solicitudes</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => (
                  <tr key={city.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium">{city.cityName}</span>
                        {!city.active && city.pausedReason && (
                          <span className="text-[11px] text-muted-foreground">{city.pausedReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{city.ubigeoProvinceCode}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={city.active ? 'success' : 'secondary'} className="text-[10px]">
                        {city.active ? 'Activa' : 'Pausada'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Switch
                        checked={city.active}
                        onCheckedChange={(checked) => handleToggle(city, checked)}
                        disabled={isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Dialog: pausar con motivo */}
      <Dialog open={!!pauseDialogCity} onOpenChange={(open) => !open && setPauseDialogCity(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pausar {pauseDialogCity?.cityName}</DialogTitle>
            <DialogDescription>
              Deja de aceptar nuevas solicitudes en esta ciudad. Puedes registrar el motivo para el historial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Motivo (opcional)</Label>
            <Input
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Ej: NPL local 13.5%, sobre el umbral"
              className="h-9"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={confirmPause} disabled={isPending} variant="destructive">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Pausar ciudad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: agregar ciudad */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar ciudad</DialogTitle>
            <DialogDescription>Código ubigeo de provincia (4 dígitos, catálogo INEI)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Código ubigeo (provincia)</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Ej: 1301"
                maxLength={4}
                className="h-9 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Trujillo"
                className="h-9"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={handleCreate} disabled={isPending || !newCode.trim() || !newName.trim()}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Horario ──────────────────────────────────────────────────────────────────

function BusinessHoursSection() {
  const [hours, setHours] = useState<AdminBusinessHours | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState('08:00');
  const [draftClose, setDraftClose] = useState('20:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await getAdminBusinessHoursAction();
    setHours(data);
  }

  function openDialog() {
    if (hours) {
      setDraftOpen(hours.openTime.slice(0, 5));
      setDraftClose(hours.closeTime.slice(0, 5));
    }
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateAdminBusinessHoursAction({
      openTime: `${draftOpen}:00`,
      closeTime: `${draftClose}:00`,
    });
    setSaving(false);

    if (result.ok) {
      toast.success('Horario actualizado');
      setDialogOpen(false);
      await load();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Horario de Solicitudes
            </CardTitle>
            <CardDescription>
              Fuera de este horario, las nuevas solicitudes se rechazan automáticamente
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" onClick={openDialog} />}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Editar horario</DialogTitle>
                <DialogDescription>Ventana en la que se aceptan nuevas solicitudes (hora de Lima)</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Apertura</Label>
                  <Input type="time" value={draftOpen} onChange={(e) => setDraftOpen(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Cierre</Label>
                  <Input type="time" value={draftClose} onChange={(e) => setDraftClose(e.target.value)} className="h-9" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Guardar cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {hours === null ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <p className="text-sm text-foreground">
            {formatHour(hours.openTime)} — {formatHour(hours.closeTime)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
