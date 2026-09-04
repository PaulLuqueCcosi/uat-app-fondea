'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPinOff, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getAdminCitiesAction, getAdminBusinessHoursAction } from '@/app/actions/admin-availability.actions';
import type { AdminCityAvailability, AdminBusinessHours } from '@/modules/admin/admin-availability.service';

/** "08:00:00" → "8:00 AM" */
function formatHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Card resumen de ciudades activas/pausadas + horario de solicitudes (M1 #58)
 * en la página general de settings. Link a la página dedicada para editar
 * — mismo patrón que PassportRangesCard / DepositAccountCard / PenaltyConfigCard.
 */
export function AvailabilityCard() {
  const [cities, setCities] = useState<AdminCityAvailability[] | null>(null);
  const [hours, setHours] = useState<AdminBusinessHours | null>(null);

  useEffect(() => {
    getAdminCitiesAction().then(setCities);
    getAdminBusinessHoursAction().then(setHours);
  }, []);

  const pausedCount = (cities ?? []).filter((c) => !c.active).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPinOff className="h-4 w-4 text-primary" /> Ciudades y Horario
          </CardTitle>
          <Link href="/admin/settings/availability">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Configurar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          Ciudades activas y horario de aceptación de nuevas solicitudes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {cities === null || hours === null ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">Ciudades registradas</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-xs">{cities.length}</Badge>
                {pausedCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{pausedCount} pausada{pausedCount > 1 ? 's' : ''}</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">Horario de solicitudes</span>
              <span className="text-sm font-mono text-muted-foreground">
                {formatHour(hours.openTime)} – {formatHour(hours.closeTime)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
