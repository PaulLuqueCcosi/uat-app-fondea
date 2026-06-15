'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Copy, Check, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Programa de Referidos — Card compacta para el dashboard.
 * Muestra el código, botón de WhatsApp y link a la página de detalle.
 *
 * TODO: Conectar con sistema real de referidos.
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
    navigator.clipboard.writeText(mockReferral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Solicita tu préstamo en FONDEA! Usa mi código ${mockReferral.code} y ambos ganamos puntos para el Pasaporte Financiero. ${mockReferral.link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-accent-800" />
          Referidos
        </CardTitle>
        <CardDescription className="text-[11px]">
          Gana <span className="font-semibold text-accent-800">{mockReferral.pointsPerReferral} puntos</span> para tu Pasaporte Financiero por cada amigo
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {/* Código */}
        <div className="flex items-center gap-2 rounded-md bg-white border border-accent-200 px-2.5 py-2">
          <code className="text-sm font-bold text-accent-900 tracking-wider flex-1">
            {mockReferral.code}
          </code>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-accent-100 transition-colors"
            title="Copiar código"
          >
            <Copy className={`w-3.5 h-3.5 text-muted-foreground ${copied ? 'hidden' : ''}`} />
            <Check className={`w-3.5 h-3.5 text-success-600 ${copied ? '' : 'hidden'}`} />
          </button>
        </div>

        {/* Stats mini */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><span className="font-semibold text-foreground">{mockReferral.referralsCount}</span> amigos</span>
          <span>·</span>
          <span><span className="font-semibold text-accent-800">{mockReferral.pointsEarned}</span> puntos</span>
        </div>

        {/* Acciones */}
        <Button
          size="sm"
          className="w-full gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-[11px]"
          onClick={handleShareWhatsApp}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Compartir por WhatsApp
        </Button>
      </CardContent>

      <CardFooter>
        <Link
          href="/dashboard/referidos"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ver detalles
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
