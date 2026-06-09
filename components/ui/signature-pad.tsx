'use client';

import * as React from 'react';
import { useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pen, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface SignaturePadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export default function SignaturePad({
  value,
  onChange,
  label = 'Firmar',
  description = 'Dibuja tu firma con el dedo o mouse. Mantén presionado para confirmar.',
  disabled = false,
  className,
}: SignaturePadProps) {
  const [open, setOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<Point | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const HOLD_DURATION = 1000;

  // ── Canvas helpers ──────────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    setHasDrawn(true);
    lastPoint.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canvasRef.current || !lastPoint.current) return;
    e.preventDefault();

    const ctx = canvasRef.current.getContext('2d')!;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = pos;
  };

  const endDraw = () => {
    setDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  // ── Hold to confirm ─────────────────────────────────────────────────────

  const startHold = useCallback(() => {
    if (!hasDrawn) return;
    setHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHoldProgress(Math.min(elapsed / HOLD_DURATION, 1));
    }, 16);

    holdTimerRef.current = setTimeout(() => {
      // Confirmar
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onChange(dataUrl);
        setOpen(false);
      }
      setHolding(false);
      setHoldProgress(0);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }, HOLD_DURATION);
  }, [hasDrawn, onChange]);

  const cancelHold = useCallback(() => {
    setHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
  }, []);

  // ── Cuando se abre el dialog, preparar canvas ──────────────────────────

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setHasDrawn(false);
      // Limpiar canvas cuando se abre
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="rounded-lg border border-border bg-white p-2">
          <img src={value} alt="Tu firma" className="w-full h-20 object-contain" />
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(true)}
              disabled={disabled}
              className="flex-1"
            >
              <Pen className="w-3.5 h-3.5 mr-1.5" />
              Volver a firmar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(true)}
          disabled={disabled}
          className="w-full h-20 border-dashed"
        >
          <Pen className="w-4 h-4 mr-2" />
          {label}
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tu firma</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="relative rounded-lg border-2 border-dashed border-border bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair block"
              style={{ height: '200px', touchAction: 'none' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground">Firma aquí</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clearCanvas} disabled={!hasDrawn}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Limpiar
            </Button>

            <div className="flex-1" />

            <Button
              type="button"
              disabled={!hasDrawn}
              className="relative overflow-hidden min-w-[160px]"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
            >
              {holding && (
                <div
                  className="absolute inset-0 bg-white/20"
                  style={{ width: `${holdProgress * 100}%` }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {holding ? 'Manteniendo…' : 'Mantener para confirmar'}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
