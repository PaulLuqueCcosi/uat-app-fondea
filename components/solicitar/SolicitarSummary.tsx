'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormHeader } from '@/components/ui/form-header';
import {
  CheckCircle,
  DollarSign,
  Briefcase,
  Users,
  MapPin,
  AlertCircle,
  Building2,
  Edit,
  Home,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// DATOS DEMO - Reemplazar con datos reales del backend
const DEMO_DATA = {
  // Perfil Laboral
  labor: {
    employmentStatus: 'Empleado en planilla',
    industry: 'Tecnología',
    company: 'Tech Solutions SAC',
    position: 'Desarrollador Senior',
    monthlyIncome: 5500,
    hasAdditionalIncome: true,
    additionalIncomes: [
      { amount: 800, source: 'Freelance' },
      { amount: 500, source: 'Alquiler de propiedad' }
    ]
  },
  // Perfil Económico
  economic: {
    monthlyExpenses: 2800,
    hasDebts: true,
    debts: [
      { entity: 'BCP', type: 'Tarjeta de crédito', amount: 5000, monthlyPayment: 450 },
      { entity: 'Interbank', type: 'Préstamo personal', amount: 8000, monthlyPayment: 350 }
    ],
    hasProperty: true,
    hasVehicle: false
  },
  // Referencias
  references: [
    { name: 'María García López', phone: '956123456', relationship: 'Madre' },
    { name: 'Carlos Ruiz Díaz', phone: '987789012', relationship: 'Colega', yearsKnown: 5 }
  ],
  // Dirección
  address: {
    type: 'manual',
    street: 'Av. Javier Prado 1234, Dpto 501',
    district: 'San Isidro',
    province: 'Lima',
    region: 'Lima'
  },
  // Cuenta Bancaria
  bankAccount: {
    bank: 'BCP',
    cci: '00211234567890123456'
  }
};

export function FunnelSummary() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState({
    labor: true,
    economic: true,
    references: true,
    address: true,
    bankAccount: true
  });

  // Estado de las declaraciones PEP
  const [pepDeclarations, setPepDeclarations] = useState({
    not_pep: false,
    not_pep_relative: false,
    accept_terms: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async () => {
    // Validar que todas las declaraciones estén marcadas
    if (!pepDeclarations.not_pep || !pepDeclarations.not_pep_relative || !pepDeclarations.accept_terms) {
      setError('Debes aceptar todas las declaraciones para continuar.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // TODO: Llamar a la API para crear la solicitud incluyendo pepDeclarations
      // const result = await submitApplication({ ...data, pep_declarations: pepDeclarations });
      // const solicitudId = result.id;

      // Simular envío y generar ID temporal
      await new Promise(resolve => setTimeout(resolve, 1500));
      const solicitudId = 'demo-' + Date.now();

      // Redirigir a la página de evaluación
      router.push(`/solicitudes/${solicitudId}/evaluando`);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Error al enviar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales
  const totalIncome = DEMO_DATA.labor.monthlyIncome +
    (DEMO_DATA.labor.additionalIncomes?.reduce((sum, inc) => sum + inc.amount, 0) || 0);
  const totalDebtPayment = DEMO_DATA.economic.debts?.reduce((sum, debt) => sum + debt.monthlyPayment, 0) || 0;
  const availableIncome = totalIncome - DEMO_DATA.economic.monthlyExpenses - totalDebtPayment;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="pb-4">
        <FormHeader
          icon={FileText}
          title="Resumen de tu Solicitud"
          description="Revisa que toda la información sea correcta antes de continuar"
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-6">
        {/* 1. PERFIL LABORAL */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('labor')}
                >
                  <Briefcase className="w-5 h-5 text-primary" />
                </button>
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleSection('labor')}
                >
                  <h3 className="text-lg font-semibold text-foreground">Perfil Laboral</h3>
                  {!expandedSections.labor && (
                    <p className="text-sm text-muted-foreground">
                      {DEMO_DATA.labor.employmentStatus} • S/ {totalIncome.toLocaleString()}/mes
                    </p>
                  )}
                  {expandedSections.labor && (
                    <p className="text-sm text-muted-foreground">Información sobre tu empleo</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Completo</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/labor')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('labor')}
                  className="cursor-pointer"
                >
                  {expandedSections.labor ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.labor && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Situación laboral</p>
                  <p className="font-medium text-foreground">{DEMO_DATA.labor.employmentStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sector</p>
                  <p className="font-medium text-foreground">{DEMO_DATA.labor.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                  <p className="font-medium text-foreground">{DEMO_DATA.labor.company}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cargo</p>
                  <p className="font-medium text-foreground">{DEMO_DATA.labor.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ingreso mensual</p>
                  <p className="font-semibold text-foreground text-lg">S/ {DEMO_DATA.labor.monthlyIncome.toLocaleString()}</p>
                </div>
                {DEMO_DATA.labor.hasAdditionalIncome && DEMO_DATA.labor.additionalIncomes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ingresos adicionales</p>
                    <div className="space-y-1">
                      {DEMO_DATA.labor.additionalIncomes.map((inc, idx) => (
                        <p key={idx} className="text-sm text-foreground">
                          <span className="font-medium">S/ {inc.amount.toLocaleString()}</span> - {inc.source}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* 2. PERFIL ECONÓMICO */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('economic')}
                >
                  <DollarSign className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('economic')}>
                  <h3 className="text-lg font-semibold text-foreground">Perfil Económico</h3>
                  {!expandedSections.economic && (
                    <p className="text-sm text-muted-foreground">
                      Gastos S/ {DEMO_DATA.economic.monthlyExpenses.toLocaleString()} • {DEMO_DATA.economic.debts.length} deudas • Capacidad: S/ {availableIncome.toLocaleString()}
                    </p>
                  )}
                  {expandedSections.economic && (
                    <p className="text-sm text-muted-foreground">Gastos, deudas y patrimonio</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Completo</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/economic')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('economic')}
                  className="cursor-pointer"
                >
                  {expandedSections.economic ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.economic && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {/* Resumen financiero */}
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ingresos totales</p>
                    <p className="text-lg font-bold text-primary">S/ {totalIncome.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gastos + Deudas</p>
                    <p className="text-lg font-bold text-foreground">
                      S/ {(DEMO_DATA.economic.monthlyExpenses + totalDebtPayment).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Capacidad de pago</p>
                    <p className="text-lg font-bold text-green-600">S/ {availableIncome.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gastos mensuales</p>
                  <p className="font-medium text-foreground">S/ {DEMO_DATA.economic.monthlyExpenses.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Deudas activas</p>
                  <p className="font-medium text-foreground">
                    {DEMO_DATA.economic.hasDebts ? `${DEMO_DATA.economic.debts.length} deuda(s)` : 'Sin deudas'}
                  </p>
                </div>

                {DEMO_DATA.economic.hasDebts && DEMO_DATA.economic.debts && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Detalle de deudas</p>
                    <div className="space-y-2">
                      {DEMO_DATA.economic.debts.map((debt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{debt.entity} - {debt.type}</p>
                            <p className="text-xs text-muted-foreground">Saldo: S/ {debt.amount.toLocaleString()}</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">S/ {debt.monthlyPayment}/mes</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Patrimonio</p>
                  <div className="flex gap-2 flex-wrap">
                    {DEMO_DATA.economic.hasProperty && (
                      <Badge variant="outline">Inmueble propio</Badge>
                    )}
                    {DEMO_DATA.economic.hasVehicle && (
                      <Badge variant="outline">Vehículo propio</Badge>
                    )}
                    {!DEMO_DATA.economic.hasProperty && !DEMO_DATA.economic.hasVehicle && (
                      <span className="text-sm text-muted-foreground">Sin patrimonio declarado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 3. REFERENCIAS */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('references')}
                >
                  <Users className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('references')}>
                  <h3 className="text-lg font-semibold text-foreground">Referencias Personales</h3>
                  {!expandedSections.references && (
                    <p className="text-sm text-muted-foreground">
                      {DEMO_DATA.references.length} referencias agregadas
                    </p>
                  )}
                  {expandedSections.references && (
                    <p className="text-sm text-muted-foreground">Personas que te conocen</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Completo</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/references')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('references')}
                  className="cursor-pointer"
                >
                  {expandedSections.references ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.references && (
            <div className="px-6 pb-6 border-t pt-4">
              <div className="space-y-3">
                {DEMO_DATA.references.map((ref, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{ref.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ref.phone} • {ref.relationship}
                        {ref.yearsKnown && ` • ${ref.yearsKnown} años de conocidos`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 4. DIRECCIÓN */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('address')}
                >
                  <MapPin className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('address')}>
                  <h3 className="text-lg font-semibold text-foreground">Dirección de Residencia</h3>
                  {!expandedSections.address && (
                    <p className="text-sm text-muted-foreground">
                      {DEMO_DATA.address.district}, {DEMO_DATA.address.province}
                    </p>
                  )}
                  {expandedSections.address && (
                    <p className="text-sm text-muted-foreground">Tu domicilio actual</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Completo</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/address')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('address')}
                  className="cursor-pointer"
                >
                  {expandedSections.address ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.address && (
            <div className="px-6 pb-6 border-t pt-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dirección completa</p>
                  <p className="font-medium text-foreground">{DEMO_DATA.address.street}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Distrito</p>
                    <p className="font-medium text-foreground">{DEMO_DATA.address.district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Provincia</p>
                    <p className="font-medium text-foreground">{DEMO_DATA.address.province}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Región</p>
                    <p className="font-medium text-foreground">{DEMO_DATA.address.region}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 5. CUENTA BANCARIA */}
        <Card className="border-2 overflow-hidden">
          <div className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  className="p-2 bg-primary/10 rounded-lg cursor-pointer"
                  onClick={() => toggleSection('bankAccount')}
                >
                  <Building2 className="w-5 h-5 text-primary" />
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => toggleSection('bankAccount')}>
                  <h3 className="text-lg font-semibold text-foreground">Cuenta para Desembolso</h3>
                  {!expandedSections.bankAccount && (
                    <p className="text-sm text-muted-foreground">
                      {DEMO_DATA.bankAccount.bank} • •••{DEMO_DATA.bankAccount.cci.slice(-4)}
                    </p>
                  )}
                  {expandedSections.bankAccount && (
                    <p className="text-sm text-muted-foreground">Donde recibirás el préstamo</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Completo</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push('/solicitar/bank-account')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => toggleSection('bankAccount')}
                  className="cursor-pointer"
                >
                  {expandedSections.bankAccount ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {expandedSections.bankAccount && (
            <div className="px-6 pb-6 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Banco</p>
                  <p className="font-medium text-foreground">{DEMO_DATA.bankAccount.bank}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CCI</p>
                  <p className="font-mono text-sm text-foreground">{DEMO_DATA.bankAccount.cci}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* DECLARACIONES LEGALES */}
        <Card className="p-6 bg-primary/5 border-2 border-primary/20">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-4">Declaraciones Legales</h4>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pepDeclarations.not_pep}
                    onChange={(e) => setPepDeclarations(prev => ({ ...prev, not_pep: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    Declaro que <strong>no soy Persona Expuesta Políticamente (PEP)</strong>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pepDeclarations.not_pep_relative}
                    onChange={(e) => setPepDeclarations(prev => ({ ...prev, not_pep_relative: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    Declaro que <strong>no soy pariente de una PEP hasta el 2do grado de consanguinidad o afinidad</strong>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={pepDeclarations.accept_terms}
                    onChange={(e) => setPepDeclarations(prev => ({ ...prev, accept_terms: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">
                    Acepto los <strong>Términos y Condiciones</strong> y consiento el uso de mis datos personales
                  </span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Fondea se reserva el derecho de solicitar documentación adicional para verificar la información proporcionada.
                La falsedad de datos puede resultar en el rechazo inmediato de la solicitud.
              </p>
            </div>
          </div>
        </Card>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Volver al dashboard
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !pepDeclarations.not_pep || !pepDeclarations.not_pep_relative || !pepDeclarations.accept_terms}
            className="flex-1"
            size="lg"
          >
            {loading ? 'Enviando...' : 'Enviar solicitud y continuar →'}
          </Button>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
