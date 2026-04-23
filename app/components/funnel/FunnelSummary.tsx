'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { CheckCircle, DollarSign, Briefcase, CreditCard, Users, MapPin, AlertCircle } from 'lucide-react';
import { submitApplication } from '@/app/actions/loan.actions';
import type { LoanApplication } from '@/lib/types';

interface FunnelSummaryProps {
  application: LoanApplication | null;
}

export function FunnelSummary({ application }: FunnelSummaryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark mb-2">No hay solicitud activa</h2>
          <p className="text-fondea-text mb-6">
            No encontramos datos de tu solicitud. Por favor, completa los pasos anteriores.
          </p>
          <Button onClick={() => router.push('/funnel/labor')}>
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  const { simulation, labor, economic, references, additional } = application;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await submitApplication();
      if (result.success) {
        router.push('/funnel/kyc-documents');
      } else {
        setError(result.error || 'Error al enviar la solicitud');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Error al enviar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = labor && economic && references && additional;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">
          Resumen de tu Solicitud
        </h1>
        <p className="text-fondea-text">
          Revisa que toda la información sea correcta antes de continuar.
        </p>
      </div>

      <div className="space-y-4">
        {/* Simulación */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Préstamo Solicitado
            </h3>
            <Badge variant="success" label="Completo" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-fondea-text">Monto</p>
              <p className="text-lg font-bold text-dark">S/ {simulation.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-fondea-text">Plazo</p>
              <p className="text-lg font-bold text-dark">{simulation.months} meses</p>
            </div>
            <div>
              <p className="text-sm text-fondea-text">Cuota mensual</p>
              <p className="text-lg font-bold text-dark">S/ {simulation.monthlyPayment.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-fondea-text">TEA</p>
              <p className="text-lg font-bold text-dark">{simulation.tea}%</p>
            </div>
          </div>
        </Card>

        {/* Perfil Laboral */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Perfil Laboral
            </h3>
            {labor ? (
              <Badge variant="success" label="Completo" />
            ) : (
              <Badge variant="error" label="Incompleto" />
            )}
          </div>
          {labor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-fondea-text">Situación laboral</p>
                <p className="font-medium text-dark">{labor.employmentStatus}</p>
              </div>
              <div>
                <p className="text-fondea-text">Industria</p>
                <p className="font-medium text-dark">{labor.industry}</p>
              </div>
              {labor.companyName && (
                <div>
                  <p className="text-fondea-text">Empresa</p>
                  <p className="font-medium text-dark">{labor.companyName}</p>
                </div>
              )}
              <div>
                <p className="text-fondea-text">Ingreso mensual</p>
                <p className="font-medium text-dark">S/ {labor.monthlyIncome?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-fondea-text">Completa tu perfil laboral</p>
          )}
        </Card>

        {/* Perfil Económico */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Perfil Económico
            </h3>
            {economic ? (
              <Badge variant="success" label="Completo" />
            ) : (
              <Badge variant="error" label="Incompleto" />
            )}
          </div>
          {economic ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-fondea-text">Ingresos mensuales</p>
                <p className="font-medium text-dark">S/ {economic.monthlyIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-fondea-text">Gastos mensuales</p>
                <p className="font-medium text-dark">S/ {economic.monthlyExpenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-fondea-text">Deudas activas</p>
                <p className="font-medium text-dark">{economic.hasDebts ? `${economic.debts.length} deuda(s)` : 'Sin deudas'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-fondea-text">Completa tu perfil económico</p>
          )}
        </Card>

        {/* Referencias */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Referencias
            </h3>
            {references ? (
              <Badge variant="success" label="Completo" />
            ) : (
              <Badge variant="error" label="Incompleto" />
            )}
          </div>
          {references ? (
            <div className="space-y-2">
              {references.references.map((ref, idx) => (
                <div key={ref.id} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-dark">{ref.name}</p>
                    <p className="text-fondea-text">{ref.phone} • {ref.relationship}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fondea-text">Agrega tus referencias personales</p>
          )}
        </Card>

        {/* Información Adicional */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Información Adicional
            </h3>
            {additional ? (
              <Badge variant="success" label="Completo" />
            ) : (
              <Badge variant="error" label="Incompleto" />
            )}
          </div>
          {additional ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="md:col-span-2">
                <p className="text-fondea-text">Dirección</p>
                <p className="font-medium text-dark">
                  {additional.address}, {additional.district}, {additional.city}
                </p>
              </div>
              <div>
                <p className="text-fondea-text">Tipo de vivienda</p>
                <p className="font-medium text-dark">{additional.housingType}</p>
              </div>
              <div>
                <p className="text-fondea-text">Estado civil</p>
                <p className="font-medium text-dark">{additional.maritalStatus}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-fondea-text">Completa tu información adicional</p>
          )}
        </Card>

        {/* Términos y condiciones */}
        {isComplete && (
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-dark mb-2">Declaración Jurada</h4>
                <p className="text-sm text-dark mb-3">
                  Al continuar, declaro que toda la información proporcionada es verídica y completa.
                  Autorizo a Fondea a verificar mi información crediticia y contactar mis referencias.
                </p>
                <p className="text-xs text-fondea-text">
                  Fondea se reserva el derecho de solicitar documentación adicional para verificar la información proporcionada.
                </p>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <div className="p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Volver al dashboard
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!isComplete}
            className="flex-1"
            size="lg"
          >
            {isComplete ? 'Enviar solicitud →' : 'Completa todos los pasos'}
          </Button>
        </div>
      </div>
    </div>
  );
}
