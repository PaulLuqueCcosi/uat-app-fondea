'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { X, RefreshCw, Camera } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ── Tipos MediaPipe (cargados dinámicamente) ──────────────────────────────────
type FaceDetectorInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { detections: Detection[] };
  detect: (canvas: HTMLCanvasElement) => { detections: Detection[] };
  setOptions: (opts: { runningMode: string }) => Promise<void>;
  close: () => void;
};

type Detection = {
  categories: { score: number }[];
  boundingBox?: { originX: number; originY: number; width: number; height: number };
};

// ── Umbrales de confianza ─────────────────────────────────────────────────────
// Ajusta estos valores para controlar la exigencia de la detección facial.
// THRESHOLD_GREEN  → mínimo para considerar el rostro válido (habilita captura)
// THRESHOLD_ORANGE → mínimo para mostrar advertencia naranja (por debajo → rojo)
const THRESHOLD_GREEN  = 0.95;
const THRESHOLD_ORANGE = 0.61;

type FaceStatus = 'none' | 'red' | 'orange' | 'green';

function getStatus(score: number | null): FaceStatus {
  if (score === null) return 'none';
  if (score >= THRESHOLD_GREEN)  return 'green';
  if (score >= THRESHOLD_ORANGE) return 'orange';
  return 'red';
}

const STATUS_CONFIG: Record<FaceStatus, { color: string; label: string; ovalColor: string }> = {
  none:   { color: 'rgba(0,0,0,0.75)',          label: 'Buscando rostro…',                ovalColor: 'rgba(255,255,255,0.4)' },
  red:    { color: 'rgba(220,53,69,0.85)',       label: 'Rostro no detectado',             ovalColor: '#dc3545' },
  orange: { color: 'rgba(255,140,0,0.85)',       label: 'Acércate más a la cámara',        ovalColor: '#ff8c00' },
  green:  { color: 'rgba(40,167,69,0.85)',       label: '✓ Listo — puedes capturar',       ovalColor: '#28a745' },
};

// ── Carga dinámica de MediaPipe ───────────────────────────────────────────────
let detectorPromise: Promise<FaceDetectorInstance> | null = null;

async function loadFaceDetector(): Promise<FaceDetectorInstance> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FaceDetector, FilesetResolver } = await import(
        /* webpackIgnore: true */
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0' as string
      ) as { FaceDetector: any; FilesetResolver: any };

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
      });
      return detector as FaceDetectorInstance;
    })();
  }
  return detectorPromise;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  mode: 'document' | 'face';
  title: string;
  description: string;
  fullScreen?: boolean;
}

// ── Componente ────────────────────────────────────────────────────────────────
export function CameraModal({
  open,
  onClose,
  onCapture,
  mode,
  title,
  description,
  fullScreen = false,
}: CameraModalProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);   // captura limpia
  const overlayRef      = useRef<HTMLCanvasElement>(null);   // guía visual
  const animFrameRef    = useRef<number>(0);
  const lastTimeRef     = useRef<number>(-1);
  const detectorRef     = useRef<FaceDetectorInstance | null>(null);
  const runningModeRef  = useRef<'IMAGE' | 'VIDEO'>('IMAGE');
  const streamRef       = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    mode === 'face' ? 'user' : 'environment'
  );
  const [error, setError]           = useState('');
  const [videoReady, setVideoReady] = useState(false);
  const [faceScore, setFaceScore]   = useState<number | null>(null);

  const status = getStatus(faceScore);
  const cfg    = STATUS_CONFIG[status];
  const canCapture = mode === 'face' ? status === 'green' : true;

  // ── Iniciar cámara ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = newStream;
      setFacingMode(facing);
      setError('');
      setVideoReady(false);
      setFaceScore(null);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => setVideoReady(true);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }, []);

  // ── Detener cámara ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setVideoReady(false);
    setFaceScore(null);
  }, []);

  // ── Dibujar overlay de documento ────────────────────────────────────────────
  const drawDocumentOverlay = useCallback((canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dw = canvas.width * 0.8;
    const dh = dw * 0.63;
    const x  = (canvas.width  - dw) / 2;
    const y  = (canvas.height - dh) / 2;

    ctx.clearRect(x, y, dw, dh);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth   = 4;
    ctx.strokeRect(x, y, dw, dh);

    const cl = 30;
    ctx.lineWidth = 6;
    [[x, y, 1, 1], [x + dw, y, -1, 1], [x, y + dh, 1, -1], [x + dw, y + dh, -1, -1]].forEach(
      ([cx, cy, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cx as number, (cy as number) + (sy as number) * cl);
        ctx.lineTo(cx as number, cy as number);
        ctx.lineTo((cx as number) + (sx as number) * cl, cy as number);
        ctx.stroke();
      }
    );
  }, []);

  // ── Dibujar overlay de rostro ───────────────────────────────────────────────
  const drawFaceOverlay = useCallback(
    (canvas: HTMLCanvasElement, video: HTMLVideoElement, ovalColor: string) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sombra oscura
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width  / 2;
      const cy = canvas.height / 2;
      const rx = canvas.width  * 0.32;
      const ry = canvas.height * 0.42;

      // Recorte transparente (óvalo)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Borde del óvalo con color de estado
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = ovalColor;
      ctx.lineWidth   = 5;
      ctx.shadowColor = ovalColor;
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    []
  );

  // ── Loop de detección en tiempo real ────────────────────────────────────────
  const detectionLoop = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = overlayRef.current;
    if (!video || !canvas || !videoReady) {
      animFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    if (mode === 'document') {
      drawDocumentOverlay(canvas, video);
      animFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    // Modo face: intentar detección con MediaPipe
    if (!detectorRef.current) {
      drawFaceOverlay(canvas, video, STATUS_CONFIG['none'].ovalColor);
      animFrameRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    if (video.currentTime !== lastTimeRef.current && video.readyState >= 2) {
      lastTimeRef.current = video.currentTime;

      try {
        if (runningModeRef.current !== 'VIDEO') {
          runningModeRef.current = 'VIDEO';
          await detectorRef.current.setOptions({ runningMode: 'VIDEO' });
        }

        const results    = detectorRef.current.detectForVideo(video, performance.now());
        const detections = results.detections;

        if (!detections || detections.length === 0) {
          setFaceScore(null);
          drawFaceOverlay(canvas, video, STATUS_CONFIG['none'].ovalColor);
        } else {
          const best  = detections.reduce((a, b) =>
            b.categories[0].score > a.categories[0].score ? b : a
          );
          const score = best.categories[0].score;
          setFaceScore(score);
          drawFaceOverlay(canvas, video, getStatus(score) === 'none' ? STATUS_CONFIG['none'].ovalColor : STATUS_CONFIG[getStatus(score)].ovalColor);
        }
      } catch {
        // Si falla la detección, solo dibujamos el óvalo sin score
        drawFaceOverlay(canvas, video, STATUS_CONFIG['none'].ovalColor);
      }
    }

    animFrameRef.current = requestAnimationFrame(detectionLoop);
  }, [videoReady, mode, drawDocumentOverlay, drawFaceOverlay]);

  // ── Efectos ─────────────────────────────────────────────────────────────────
  // Cargar detector al montar (solo para modo face)
  useEffect(() => {
    if (mode !== 'face') return;
    loadFaceDetector()
      .then((d) => { detectorRef.current = d; })
      .catch(console.error);
  }, [mode]);

  // Abrir/cerrar cámara con el modal
  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Iniciar loop cuando el video esté listo
  useEffect(() => {
    if (videoReady && open) {
      cancelAnimationFrame(animFrameRef.current);
      detectionLoop();
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [videoReady, open, detectionLoop]);

  // ── Capturar foto (sin overlay) ─────────────────────────────────────────────
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !canCapture) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar solo el video, sin overlay
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      },
      'image/jpeg',
      0.95
    );
  };

  const switchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    cancelAnimationFrame(animFrameRef.current);
    startCamera(next);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        fullScreen={fullScreen}
        className={
          fullScreen
            ? 'bg-black p-0'
            : 'bg-black p-0 w-[95vw] h-[90vh] max-w-2xl rounded-2xl overflow-hidden'
        }
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div
            className={`absolute top-0 left-0 right-0 z-20 bg-linear-to-b from-black/80 to-transparent ${
              fullScreen ? 'p-4' : 'p-3 rounded-t-2xl'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-base">{title}</h3>
                <p className="text-white/80 text-xs">{description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Video + Overlay */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={mode === 'face' ? { transform: 'scaleX(-1)' } : undefined}
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full"
              style={{
                pointerEvents: 'none',
                ...(mode === 'face' ? { transform: 'scaleX(-1)' } : {}),
              }}
            />
            {/* Canvas oculto para captura limpia */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Botón cambiar cámara (solo documentos) */}
            {mode === 'document' && (
              <Button
                variant="secondary"
                size="icon"
                className={`absolute ${fullScreen ? 'top-20 right-4' : 'top-16 right-3'} z-10`}
                onClick={switchCamera}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Footer */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black/80 to-transparent ${
              fullScreen ? 'p-6' : 'p-4 rounded-b-2xl'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Badge de estado (solo modo face) */}
              {mode === 'face' && (
                <div
                  className="px-4 py-1.5 rounded-full text-white text-xs font-semibold transition-all duration-300"
                  style={{ background: cfg.color }}
                >
                  {cfg.label}
                  {faceScore !== null && (
                    <span className="ml-2 opacity-80">
                      {Math.round(faceScore * 100)}%
                    </span>
                  )}
                </div>
              )}

              {mode === 'document' && (
                <p className="text-white/80 text-xs">Alinea el DNI dentro del recuadro</p>
              )}

              {/* Botón capturar */}
              <Button
                size="lg"
                onClick={capturePhoto}
                disabled={!canCapture}
                className={`rounded-full p-0 transition-all duration-300 ${
                  fullScreen ? 'w-20 h-20' : 'w-16 h-16'
                } ${
                  canCapture
                    ? 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/40'
                    : 'bg-white/20 text-white/40 cursor-not-allowed'
                }`}
              >
                <Camera className={fullScreen ? 'w-8 h-8' : 'w-7 h-7'} />
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className={`absolute ${
                fullScreen ? 'top-20' : 'top-16'
              } left-4 right-4 z-20 bg-destructive/90 text-destructive-foreground p-3 rounded-lg`}
            >
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
