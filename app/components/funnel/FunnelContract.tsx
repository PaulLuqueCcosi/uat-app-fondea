'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { FileText, Download, Check, AlertCircle } from 'lucide-react';
import { signContract } from '@/app/actions/loan.actions';

export function FunnelContract() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.strokeStyle = '#1E293B';
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        setCtx(context);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();

    // Save signature as data URL
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature('');
    }
  };

  const handleSubmit = async () => {
    if (!accepted) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    if (!signature) {
      setError('Debes firmar el contrato');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signContract(signature);
      router.push('/funnel/contract-signed');
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Error al firmar el contrato. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Contrato de Préstamo
        </h1>
        <p className="text-fondea-text">
          Revisa y firma tu contrato para finalizar el proceso.
        </p>
      </div>

      <div className="space-y-6">
        {/* Contract viewer */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contrato de Mutuo Dinerario
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => alert('Descarga simulada')}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>

          {/* Contract content (simplified) */}
          <div className="bg-background rounded-lg p-6 max-h-96 overflow-y-auto border border-border text-sm space-y-4">
            <h4 className="font-bold text-dark">CONTRATO DE MUTUO DINERARIO</h4>

            <p className="text-fondea-text">
              Conste por el presente documento, el CONTRATO DE MUTUO DINERARIO que celebran:
            </p>

            <div>
              <p className="font-semibold text-dark">EL MUTUANTE:</p>
              <p className="text-fondea-text">
                FONDEA S.A.C., con RUC N° 20123456789, con domicilio en Av. Javier Prado Este 123,
                San Isidro, Lima.
              </p>
            </div>

            <div>
              <p className="font-semibold text-dark">EL MUTUATARIO:</p>
              <p className="text-fondea-text">
                [Tu nombre completo según DNI], identificado con DNI N° [tu DNI], con domicilio en
                [tu dirección].
              </p>
            </div>

            <div>
              <p className="font-semibold text-dark">PRIMERA: OBJETO DEL CONTRATO</p>
              <p className="text-fondea-text">
                Por el presente contrato, EL MUTUANTE se obliga a entregar a EL MUTUATARIO la suma
                de [monto del préstamo] soles, en calidad de préstamo, el cual será devuelto en un
                plazo de [plazo] meses.
              </p>
            </div>

            <div>
              <p className="font-semibold text-dark">SEGUNDA: TASA DE INTERÉS</p>
              <p className="text-fondea-text">
                Las partes acuerdan que el préstamo generará intereses a una tasa efectiva anual
                (TEA) de 51.1%, calculados sobre el saldo del capital prestado.
              </p>
            </div>

            <div>
              <p className="font-semibold text-dark">TERCERA: FORMA DE PAGO</p>
              <p className="text-fondea-text">
                EL MUTUATARIO se obliga a pagar [número de cuotas] cuotas mensuales de [monto de
                cuota] soles cada una, mediante depósito en la cuenta bancaria que EL MUTUANTE
                indique.
              </p>
            </div>

            <div>
              <p className="font-semibold text-dark">CUARTA: PENALIDADES</p>
              <p className="text-fondea-text">
                En caso de mora en el pago de alguna cuota, se aplicará un interés moratorio del 5%
                mensual sobre el monto vencido.
              </p>
            </div>

            <div>
              <p className="font-semibold text-dark">QUINTA: DECLARACIÓN JURADA</p>
              <p className="text-fondea-text">
                EL MUTUATARIO declara bajo juramento que toda la información proporcionada es
                verídica y que cuenta con capacidad económica para cumplir con las obligaciones
                asumidas.
              </p>
            </div>

            <p className="text-fondea-text italic">
              [Este es un resumen simplificado. El contrato completo está disponible para descarga.]
            </p>
          </div>
        </Card>

        {/* Terms acceptance */}
        <Card className="p-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 border-2 border-border rounded checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              />
              {accepted && (
                <Check className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none" />
              )}
            </div>
            <div className="text-sm">
              <p className="text-dark group-hover:text-primary transition-colors">
                He leído y acepto los <strong>términos y condiciones</strong> del contrato de
                préstamo, así como la <strong>política de privacidad</strong> y el{' '}
                <strong>cronograma de pagos</strong>.
              </p>
            </div>
          </label>
        </Card>

        {/* Signature pad */}
        <Card className="p-6">
          <h3 className="font-semibold text-dark mb-4">Firma Digital</h3>

          <div className="bg-background rounded-lg p-4 border-2 border-dashed border-border">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full touch-none cursor-crosshair bg-white rounded"
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-fondea-text">
              Firma aquí con el mouse o con tu dedo (en móvil)
            </p>
            <Button variant="ghost" size="sm" onClick={clearSignature}>
              Limpiar
            </Button>
          </div>
        </Card>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-dark">
              <p className="font-semibold mb-1">Antes de firmar, asegúrate de:</p>
              <ul className="space-y-1 list-disc ml-4 text-fondea-text">
                <li>Haber leído todo el contrato</li>
                <li>Entender las condiciones del préstamo</li>
                <li>Estar de acuerdo con el monto, plazo y cuota mensual</li>
                <li>Conocer las penalidades por mora</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="flex-1">
            Guardar para después
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!accepted || !signature} className="flex-1" size="lg">
            Firmar y finalizar →
          </Button>
        </div>
      </div>
    </div>
  );
}
