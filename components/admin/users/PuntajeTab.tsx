'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PuntajeTabProps {
  gamification: {
    points: number;
    rank: string;
    maxLoanAmount: number;
    history: { date: string; concept: string; points: number }[];
  };
}

// Rangos del pasaporte (mock — luego viene del backend)
const PASSPORT_LEVELS = [
  { name: 'Bronce', minPoints: 0, maxPoints: 99, maxLoanAmount: 200, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { name: 'Plata', minPoints: 100, maxPoints: 249, maxLoanAmount: 350, color: 'text-neutral-600', bg: 'bg-neutral-50', border: 'border-neutral-300' },
  { name: 'Oro', minPoints: 250, maxPoints: 499, maxLoanAmount: 600, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  { name: 'Master', minPoints: 500, maxPoints: null, maxLoanAmount: 1000, color: 'text-primary-700', bg: 'bg-primary-50', border: 'border-primary-200' },
];

// Motivos predeterminados con montos por defecto
const PRESET_REASONS = [
  { value: '', label: 'Seleccionar motivo...', defaultAmount: 0 },
  { value: 'BONUS_FIDELIDAD', label: 'Bonus por fidelidad', defaultAmount: 20 },
  { value: 'CORRECCION_SISTEMA', label: 'Corrección del sistema', defaultAmount: 10 },
  { value: 'PENALIZACION_MOROSIDAD', label: 'Penalización por morosidad', defaultAmount: 30 },
  { value: 'PROMOCION', label: 'Promoción temporal', defaultAmount: 50 },
  { value: 'REFERIDO_COMPLETADO', label: 'Referido completado', defaultAmount: 15 },
  { value: 'PAGO_PUNTUAL', label: 'Pago puntual', defaultAmount: 15 },
  { value: 'AJUSTE_MANUAL', label: 'Ajuste manual (especificar)', defaultAmount: 0 },
];

export function PuntajeTab({ gamification }: PuntajeTabProps) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustCustomReason, setAdjustCustomReason] = useState('');

  // Determinar nivel actual
  const currentLevel = PASSPORT_LEVELS.find(
    (l) => gamification.points >= l.minPoints && (l.maxPoints === null || gamification.points <= l.maxPoints)
  ) ?? PASSPORT_LEVELS[0];

  const openAdjustModal = (type: 'add' | 'subtract') => {
    setAdjustType(type);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustCustomReason('');
    setShowAdjustModal(true);
  };

  const handleConfirmAdjust = () => {
    // TODO: llamar al backend
    setShowAdjustModal(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: resumen + acciones */}
        <div className="space-y-4">
          {/* Resumen */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Puntaje actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-4xl font-bold">{gamification.points}</p>
                <Badge className={currentLevel.color}>{currentLevel.name}</Badge>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rango</span>
                  <span className="font-medium">{currentLevel.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Máx. préstamo</span>
                  <span className="font-mono font-medium">S/ {currentLevel.maxLoanAmount.toLocaleString()}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ajustar puntaje</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openAdjustModal('add')}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Sumar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs text-destructive border-destructive/30" onClick={() => openAdjustModal('subtract')}>
                    <Minus className="h-3.5 w-3.5 mr-1" /> Restar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rangos del pasaporte */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rangos del pasaporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PASSPORT_LEVELS.map((level) => {
                const isCurrent = level.name === currentLevel.name;
                return (
                  <div
                    key={level.name}
                    className={`flex items-center justify-between rounded-lg border p-2.5 ${isCurrent ? `${level.bg} ${level.border}` : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-primary" />}
                      <span className={`text-sm font-medium ${isCurrent ? level.color : 'text-muted-foreground'}`}>
                        {level.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono">
                        {level.minPoints}–{level.maxPoints ?? '∞'} pts
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Máx S/ {level.maxLoanAmount}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: historial */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historial de movimientos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Concepto</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {gamification.history.map((h, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2.5">{h.date}</td>
                      <td className="px-4 py-2.5">{h.concept}</td>
                      <td className={`px-4 py-2.5 text-right font-mono font-medium ${h.points >= 0 ? 'text-success-600' : 'text-destructive'}`}>
                        {h.points >= 0 ? '+' : ''}{h.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de ajuste */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {adjustType === 'add' ? 'Sumar puntos' : 'Restar puntos'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cantidad de puntos</label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Ej: 50"
                min={1}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Motivo</label>
              <NativeSelect
                value={adjustReason}
                onChange={(e) => {
                  const reason = e.target.value;
                  setAdjustReason(reason);
                  const preset = PRESET_REASONS.find((r) => r.value === reason);
                  if (preset && preset.defaultAmount > 0) {
                    setAdjustAmount(String(preset.defaultAmount));
                  }
                }}
              >
                {PRESET_REASONS.map((r) => (
                  <NativeSelectOption key={r.value} value={r.value}>
                    {r.label}{r.defaultAmount > 0 ? ` (${r.defaultAmount} pts)` : ''}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {adjustReason === 'AJUSTE_MANUAL' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                <Input
                  value={adjustCustomReason}
                  onChange={(e) => setAdjustCustomReason(e.target.value)}
                  placeholder="Motivo del ajuste..."
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>Cancelar</Button>
            <Button
              onClick={handleConfirmAdjust}
              disabled={!adjustAmount || !adjustReason}
              className={adjustType === 'subtract' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {adjustType === 'add' ? `Sumar +${adjustAmount || 0}` : `Restar -${adjustAmount || 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
