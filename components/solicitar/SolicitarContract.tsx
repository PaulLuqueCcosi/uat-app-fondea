'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Check, AlertCircle, PenLine } from 'lucide-react';
import { signContractAction, getContractAction } from '@/app/actions/application.actions';

interface FunnelContractProps {
  applicationId?: string;
}

export function FunnelContract({ applicationId }: FunnelContractProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contractText, setContractText] = useState<string>('');

  // Detectar si estamos en el flujo de solicitudes
  const isInSolicitudFlow = pathname.includes('/solicitudes/');
  const solicitudId = applicationId;

  // Cargar contrato del backend
  useEffect(() => {
    if (!solicitudId) return;
    getContractAction(solicitudId).then((data) => {
      if (data?.contractText) {
        setContractText(data.contractText);
      }
    });
  }, [solicitudId]);

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

    if (!solicitudId) {
      setError('No se encontró la solicitud activa');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signContractAction(solicitudId, fullName);

      if (!result.success) {
        setError(result.error ?? 'Error al firmar el contrato');
        setLoading(false);
        return;
      }

      // Redirigir según el flujo
      if (isInSolicitudFlow) {
        router.push(`/solicitudes/${solicitudId}/aprobada`);
      } else {
        router.push('/solicitar/contract-signed');
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

          {/* Contract content from backend */}
          <div className="bg-background rounded-lg p-6 max-h-96 overflow-y-auto border border-border text-sm space-y-4">
            {contractText ? (
              <div className="whitespace-pre-wrap text-fondea-text">
                {contractText}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Cargando contrato...</p>
              </div>
            )}
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
              disabled={!accepted || !fullName.trim() || fullName.trim().length < 5 || loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Firmando...' : 'Firmar y finalizar →'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
