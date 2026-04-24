'use client';

import { useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Check, AlertCircle, PenLine } from 'lucide-react';
import { signContract } from '@/app/actions/loan.actions';

export function FunnelContract() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');

  // Detectar si estamos en el flujo de solicitudes
  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = params.id as string | undefined;

  const handleSubmit = async () => {
    if (!accepted) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    if (!fullName.trim()) {
      setError('Debes ingresar tu nombre completo para firmar');
      return;
    }

    if (fullName.trim().length < 5) {
      setError('El nombre debe tener al menos 5 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signContract(fullName);

      // Redirigir según el flujo
      if (isInSolicitudFlow && solicitudId) {
        router.push(`/solicitudes/${solicitudId}/aprobada`);
      } else {
        router.push('/funnel/contract-signed');
      }
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
              </ul>
            </div>
          </div>
        </div>

        {/* Firma Digital */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenLine className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-dark">Firma Digital</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-dark mb-2">
                Nombre completo
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej: Juan Carlos Pérez García"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-fondea-text mt-2">
                Al escribir tu nombre completo, estás firmando digitalmente este contrato
              </p>
            </div>

            {fullName.trim() && (
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-xs text-fondea-text mb-2">Vista previa de tu firma:</p>
                <p className="text-2xl font-signature text-primary text-center py-3 italic">
                  {fullName}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-error/10 border border-error rounded-lg">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!accepted || !fullName.trim() || fullName.trim().length < 5}
              className="w-full"
              size="lg"
            >
              Firmar y finalizar →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
