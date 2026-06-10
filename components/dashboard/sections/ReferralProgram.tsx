'use client';

import { useState } from 'react';
import { Users, Copy, Check, Share2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Programa de Referidos — Banner para compartir enlace.
 * Código único del usuario + botón copiar/compartir.
 *
 * TODO: Conectar con sistema real de referidos y puntaje.
 */

// Mock
const mockReferral = {
  code: 'MARIO2026',
  link: 'https://fondea.pe/r/MARIO2026',
  referralsCount: 2,
  pointsEarned: 30,
  pointsPerReferral: 15,
};

export function ReferralProgram() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mockReferral.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Solicita tu préstamo en FONDEA! Usa mi código ${mockReferral.code} y ambos ganamos puntos. ${mockReferral.link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Card className="border-accent-200 bg-accent-50/30">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-800" />
            Programa de Referidos
          </span>
        </CardTitle>
        <CardDescription>
          Gana <span className="font-semibold text-accent-800">S/ {mockReferral.pointsPerReferral}</span> en puntos por cada amigo que pague puntual su primera cuota
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Código */}
        <div className="rounded-lg bg-white border border-accent-200 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Tu código único</p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-lg font-bold text-accent-900 tracking-wider">
              {mockReferral.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar enlace
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{mockReferral.referralsCount}</p>
            <p className="text-[10px] text-muted-foreground">Amigos referidos</p>
          </div>
          <div className="rounded-lg bg-white border border-border p-3 text-center">
            <p className="text-lg font-bold text-accent-800">{mockReferral.pointsEarned} pts</p>
            <p className="text-[10px] text-muted-foreground">Puntos ganados</p>
          </div>
        </div>

        {/* Compartir por WhatsApp */}
        <Button
          variant="outline"
          className="w-full gap-2 border-accent-300 text-accent-900 hover:bg-accent-100"
          onClick={handleShareWhatsApp}
        >
          <Share2 className="w-4 h-4" />
          Compartir por WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
