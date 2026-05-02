'use client';

import { useEffect, useRef } from 'react';

// ── Dimensiones originales de la imagen ──────────────────────────────────────
// TODO: Actualizar con las dimensiones reales de foto_dni_electronico.png
const IMG_W = 1578;
const IMG_H = 997;

// ── Color de anotación — usa el token de error del sistema de diseño ──────────
// Canvas 2D no entiende var(), así que resolvemos el valor en runtime.
function resolveColor(): string {
  if (typeof window === 'undefined') return '#DC2626';
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-error-600').trim();
  return raw || '#DC2626';
}

const ANNOTATION_COLOR = '#DC2626'; // fallback SSR — coincide con --color-error-600

// ── Campos y sus rectángulos ──────────────────────────────────────────────────
export type DNIElectronicoField = 'dni' | 'firstName' | 'secondName' | 'firstLastName' | 'secondLastName' | 'verificationCode' | 'birth_date' | null;

// TODO: Actualizar coordenadas según la nueva imagen
const HIGHLIGHTS: Record<NonNullable<DNIElectronicoField>, { x: number; y: number; w: number; h: number; color: string }> = {
    dni: {
        x: 1236, y: 105, w: 226, h: 55,
        color: ANNOTATION_COLOR,
    },
    firstName: {
        x: 470, y: 507, w: 182, h: 53,
        color: ANNOTATION_COLOR,
    },
    secondName: {
        x: 660, y: 507, w: 180, h: 53,
        color: ANNOTATION_COLOR,
    },
    firstLastName: {
        x: 470, y: 274, w: 187, h: 50,
        color: ANNOTATION_COLOR,
    },
    secondLastName: {
        x: 470, y: 390, w: 213, h: 48,
        color: ANNOTATION_COLOR,
    },
    verificationCode: {
        x: 1478, y: 105, w: 32, h: 55,
        color: ANNOTATION_COLOR,
    },
    birth_date: {
        x: 500, y: 661, w: 171, h: 37,
        color: ANNOTATION_COLOR,
    },
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
    activeField: DNIElectronicoField;
    debugMode?: boolean; // Para mostrar todos los bordes siempre
    onFieldClick?: (field: DNIElectronicoField) => void; // Callback cuando se hace clic en un campo
}

// ── Helpers de dibujo ─────────────────────────────────────────────────────────

function drawRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    color: string,
    active: boolean,
) {
    const alpha = active ? '40' : '18'; // hex opacity
    const lineW = active ? 5 : 2.5;
    const corner = 22;

    // Relleno
    ctx.fillStyle = color + alpha;
    ctx.fillRect(x, y, w, h);

    // Borde
    ctx.strokeStyle = color + (active ? 'ff' : '88');
    ctx.lineWidth = lineW;
    ctx.strokeRect(x, y, w, h);

    // Esquinas en L (solo cuando activo)
    if (active) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
        ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner);
        ctx.moveTo(x + w, y + h - corner); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - corner, y + h);
        ctx.moveTo(x + corner, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - corner);
        ctx.stroke();
    }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DNIElectronicoAnnotatedCanvas({ activeField, debugMode = false, onFieldClick }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // Carga la imagen una sola vez
    useEffect(() => {
        const img = new Image();
        img.src = '/examples/dni/foto_dni_electronico.png';
        imgRef.current = img;
        img.onload = () => redraw(img, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Redibuja cada vez que cambia el campo activo o el modo debug
    useEffect(() => {
        if (imgRef.current?.complete) {
            redraw(imgRef.current, activeField);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeField, debugMode]);

    function redraw(img: HTMLImageElement, field: DNIElectronicoField) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resolver el token de color en runtime (Canvas 2D no entiende var())
        const annotationColor = resolveColor();
        const highlights = Object.fromEntries(
            Object.entries(HIGHLIGHTS).map(([k, v]) => [k, { ...v, color: annotationColor }])
        ) as typeof HIGHLIGHTS;

        canvas.width = IMG_W;
        canvas.height = IMG_H;

        // Imagen base
        ctx.drawImage(img, 0, 0, IMG_W, IMG_H);

        // En modo debug, mostrar todos los campos siempre
        if (debugMode) {
            // Dibujar todos los rectángulos
            Object.entries(highlights).forEach(([key, rect]) => {
                const isActive = key === field;
                drawRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.color, isActive);
            });
        } else {
            // Comportamiento normal: overlay oscuro solo cuando hay campo activo
            if (field) {
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.fillRect(0, 0, IMG_W, IMG_H);
            }

            // Dibujar solo el campo activo
            Object.entries(highlights).forEach(([key, rect]) => {
                if (field && key === field) {
                    // Recortar el overlay sobre el campo activo para que se vea la imagen
                    ctx.clearRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                    ctx.drawImage(img, rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4,
                        rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
                    // NO dibujar el borde rojo en modo normal
                }
            });
        }
    }

  // Manejar clics en el canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onFieldClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Coordenadas del clic en el canvas original
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Buscar en qué campo se hizo clic
    for (const [fieldName, fieldRect] of Object.entries(HIGHLIGHTS)) {
      if (
        x >= fieldRect.x &&
        x <= fieldRect.x + fieldRect.w &&
        y >= fieldRect.y &&
        y <= fieldRect.y + fieldRect.h
      ) {
        onFieldClick(fieldName as DNIElectronicoField);
        return;
      }
    }
  };

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: onFieldClick ? 'pointer' : 'default' }}
            onClick={handleCanvasClick}
        />
    );
}