'use client';

/**
 * ⚠️ TEMPORAL — BORRAR DESPUÉS DE PROBAR ⚠️
 *
 * Cliente del Lambda Tester.
 * Permite llenar formularios (KYC, laboral, económico, etc.),
 * construir el payload de business-validation, invocar la Lambda
 * y ver el resultado del scoring.
 *
 * Todo se guarda en localStorage. No envía datos a ningún backend propio.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Save, RotateCcw, Copy, Eye, EyeOff, Download } from 'lucide-react';
import {
  EMPLOYMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  INCOME_RECEIPT_OPTIONS,
  LOAN_PURPOSE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from '@/lib/constants';

const STORAGE_KEY = 'fondea_lambda_tester';
const CREDS_KEY = 'fondea_lambda_creds';
const RESULTS_KEY = 'fondea_lambda_results';

// ── Tipos del estado local ────────────────────────────────────────────────────

interface FormState {
  // Config
  applicationId: string;
  userId: string;
  currentScore: string;
  // KYC
  dni: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  verificationCode: string;
  birthDate: string;
  // Labor
  employmentStatus: string;
  industry: string;
  yearsOfActivity: string;
  businessRuc: string;
  monthlyIncome: string;
  incomeReceiptMethod: string;
  // Economic
  loanPurpose: string;
  monthlyExpenses: string;
  hasDebts: boolean;
  debts: { entity: string; type: string; amount: string; monthlyPayment: string }[];
  hasProperty: boolean;
  hasVehicle: boolean;
  hasServices: boolean;
  educationLevel: string;
  // References
  familyName: string;
  familyPhone: string;
  familyRelationship: string;
  nonFamilyName: string;
  nonFamilyPhone: string;
  nonFamilyRelationship: string;
  nonFamilyYearsKnown: string;
  // Address
  streetAddress: string;
  region: string;
  province: string;
  district: string;
  referralSource: string;
  // Bank
  bankName: string;
  accountType: string;
  accountNumber: string;
  cci: string;
  // Intention
  productId: string;
  amount: string;
  termDays: string;
  installmentCount: string;
  isFirstLoan: boolean;
}

interface CredsState {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  functionName: string;
  invocationType: string;
}

const DEFAULT_FORM: FormState = {
  applicationId: '550e8400-e29b-41d4-a716-446655440000',
  userId: '660e8400-e29b-41d4-a716-446655440001',
  currentScore: '450',
  dni: '73057755', firstName: 'PAUL', secondName: 'ALEXANDER',
  firstLastName: 'LUQUE', secondLastName: 'CCOSI',
  verificationCode: '4', birthDate: '2003-06-19',
  employmentStatus: 'FREELANCE', industry: 'TECNOLOGIA',
  yearsOfActivity: '2', businessRuc: '', monthlyIncome: '2000',
  incomeReceiptMethod: 'CUENTA_BANCARIA',
  loanPurpose: 'EDUCACION', monthlyExpenses: '800',
  hasDebts: false, debts: [], hasProperty: false, hasVehicle: false,
  hasServices: true, educationLevel: 'UNIVERSITARIA',
  familyName: 'Manuel Luque', familyPhone: '910212121',
  familyRelationship: 'HERMANO',
  nonFamilyName: 'Ejemplo Person', nonFamilyPhone: '982322222',
  nonFamilyRelationship: 'COLEGA', nonFamilyYearsKnown: '2',
  streetAddress: 'C10, urb alameda salaverry',
  region: '04', province: '0401', district: '040110',
  referralSource: 'REDES_SOCIALES',
  bankName: 'BCP', accountType: 'AHORROS',
  accountNumber: '1231', cci: '2312',
  productId: '550e8400-e29b-41d4-a716-446655440000',
  amount: '100', termDays: '7', installmentCount: '1', isFirstLoan: true,
};

const DEFAULT_CREDS: CredsState = {
  accessKeyId: 'AKIA6DRMVPAHIJ4AYPMM',
  secretAccessKey: '',
  region: 'us-east-1',
  functionName: 'fondea-business-validation',
  invocationType: 'RequestResponse',
};

// ── Helper: construir payload ─────────────────────────────────────────────────

function buildPayload(form: FormState) {
  const kyc = JSON.stringify({
    dni: form.dni, birthDate: form.birthDate,
    firstName: form.firstName, secondName: form.secondName,
    firstLastName: form.firstLastName, secondLastName: form.secondLastName,
    verificationCode: form.verificationCode,
  });

  const labor = JSON.stringify({
    situation: form.employmentStatus,
    details: {
      industry: form.industry,
      yearsOfActivity: Number(form.yearsOfActivity) || 0,
      businessRuc: form.businessRuc || null,
    },
    income: {
      monthlyIncome: Number(form.monthlyIncome) || 0,
      hasAdditionalIncome: false,
      additionalIncomes: [],
      incomeReceiptMethod: form.incomeReceiptMethod,
    },
  });

  const economic = JSON.stringify({
    loanPurpose: form.loanPurpose,
    monthlyExpenses: Number(form.monthlyExpenses) || 0,
    hasDebts: form.hasDebts,
    debts: form.debts.map(d => ({
      entity: d.entity,
      type: d.type,
      amount: Number(d.amount) || 0,
      monthlyPayment: Number(d.monthlyPayment) || 0,
    })),
    hasProperty: form.hasProperty,
    hasVehicle: form.hasVehicle,
    hasServices: form.hasServices,
    educationLevel: form.educationLevel,
  });

  const references = JSON.stringify({
    familyReference: {
      name: form.familyName, phone: form.familyPhone,
      relationship: form.familyRelationship, relationshipOther: null,
    },
    nonFamilyReference: {
      name: form.nonFamilyName, phone: form.nonFamilyPhone,
      relationship: form.nonFamilyRelationship, relationshipOther: null,
      yearsKnown: Number(form.nonFamilyYearsKnown) || 0,
    },
  });

  const address = JSON.stringify({
    address_type: 'MANUAL',
    google_address: null,
    street_address: form.streetAddress,
    region: form.region, province: form.province, district: form.district,
    referral_source: form.referralSource, referral_other: null,
  });

  const bankAccount = JSON.stringify({
    bank_name: form.bankName,
    account_type: form.accountType,
    account_number_masked: `****************${form.accountNumber}`,
    cci_masked: `****************${form.cci}`,
  });

  const profileSnapshot = JSON.stringify({
    kyc, labor, economic, references, address, bankAccount,
  });

  const userIntentionSnapshot = JSON.stringify({
    productId: form.productId,
    amount: Number(form.amount) || 0,
    termDays: Number(form.termDays) || 0,
    installmentCount: Number(form.installmentCount) || 0,
    isFirstLoan: form.isFirstLoan,
  });

  return {
    idempotencyKey: `validation-${form.applicationId}`,
    applicationId: form.applicationId,
    userId: form.userId,
    productId: form.productId,
    profileSnapshot,
    userIntentionSnapshot,
    currentScore: form.currentScore ? Number(form.currentScore) : null,
    callbackUrl: '/api/v1/applications/webhook/validation-result',
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export function LambdaTesterClient() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [creds, setCreds] = useState<CredsState>(DEFAULT_CREDS);
  const [result, setResult] = useState<any>(null);
  const [resultHistory, setResultHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState<string | null>(null);

  // Cargar de localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Asegurar que debts siempre sea un array (compatibilidad con datos viejos)
        setForm({ ...DEFAULT_FORM, ...parsed, debts: parsed.debts ?? [] });
      }
      const savedCreds = localStorage.getItem(CREDS_KEY);
      if (savedCreds) setCreds(JSON.parse(savedCreds));
      const savedResults = localStorage.getItem(RESULTS_KEY);
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setResultHistory(parsed);
        if (parsed.length > 0) setResult(parsed[0]);
      }
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    toast.success('Datos guardados en localStorage');
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Formulario reseteado');
  };

  const updateForm = (key: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateCreds = (key: keyof CredsState, value: string) => {
    setCreds(prev => ({ ...prev, [key]: value }));
  };

  const invoke = async () => {
    if (!creds.accessKeyId || !creds.secretAccessKey) {
      toast.error('Ingresa las credenciales AWS');
      return;
    }
    save(); // Auto-guardar antes de invocar
    setLoading(true);
    setResult(null);

    const payload = buildPayload(form);

    try {
      const res = await fetch('/api/dev/invoke-lambda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          region: creds.region,
          functionName: creds.functionName,
          invocationType: creds.invocationType,
          payload,
        }),
      });
      const data = await res.json();

      // Parsear el body si viene como string dentro del payload
      let parsed = data;
      if (data.payload?.body && typeof data.payload.body === 'string') {
        try {
          parsed = { ...data, payload: { ...data.payload, body: JSON.parse(data.payload.body) } };
        } catch { /* keep as-is */ }
      }

      setResult(parsed);

      // Guardar en historial (máximo 10 resultados)
      const entry = { ...parsed, _timestamp: new Date().toISOString(), _payload: payload };
      const newHistory = [entry, ...resultHistory].slice(0, 10);
      setResultHistory(newHistory);
      localStorage.setItem(RESULTS_KEY, JSON.stringify(newHistory));

      if (res.ok) {
        toast.success(`Lambda respondió: ${data.statusCode}`);
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (err: any) {
      const errorResult = { error: err.message, _timestamp: new Date().toISOString() };
      setResult(errorResult);
      toast.error('Error de red');
    } finally {
      setLoading(false);
    }
  };

  const copyPayload = () => {
    const payload = buildPayload(form);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success('Payload copiado al clipboard');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCurrent = () => {
    if (!result) { toast.error('No hay resultado para descargar'); return; }
    const data = {
      timestamp: result._timestamp ?? new Date().toISOString(),
      request: result._payload ?? buildPayload(form),
      response: { ...result, _timestamp: undefined, _payload: undefined },
    };
    downloadFile(JSON.stringify(data, null, 2), `lambda-result-${Date.now()}.json`);
    toast.success('Descargado');
  };

  const downloadAll = () => {
    if (resultHistory.length === 0) { toast.error('No hay historial'); return; }
    const data = resultHistory.map(entry => ({
      timestamp: entry._timestamp,
      request: entry._payload,
      response: { ...entry, _timestamp: undefined, _payload: undefined },
    }));
    downloadFile(JSON.stringify(data, null, 2), `lambda-history-${Date.now()}.json`);
    toast.success(`${data.length} resultados descargados`);
  };

  // ── Helper para inputs ──────────────────────────────────────────────────────
  const Field = ({ label, k, type = 'text' }: { label: string; k: keyof FormState; type?: string }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={form[k] as string}
        onChange={e => updateForm(k, e.target.value)}
        className="mt-1 h-8 text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-4 max-w-6xl">
      {/* ── AWS Config ── */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">Configuración AWS</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Access Key ID</label>
            <Input
              value={creds.accessKeyId}
              onChange={e => updateCreds('accessKeyId', e.target.value)}
              className="mt-1 h-8 text-sm font-mono"
              placeholder="AKIA..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Secret Access Key</label>
            <div className="relative mt-1">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={creds.secretAccessKey}
                onChange={e => updateCreds('secretAccessKey', e.target.value)}
                className="h-8 text-sm font-mono pr-8"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1.5 text-muted-foreground"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Región</label>
              <Input value={creds.region} onChange={e => updateCreds('region', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Function</label>
              <Input value={creds.functionName} onChange={e => updateCreds('functionName', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <NativeSelect value={creds.invocationType} onChange={e => updateCreds('invocationType', e.target.value)} className="mt-1 h-8 text-xs">
                <NativeSelectOption value="Event">Event (async)</NativeSelectOption>
                <NativeSelectOption value="RequestResponse">Sync</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── IDs y Score ── */}
      <Card>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Application ID" k="applicationId" />
          <Field label="User ID" k="userId" />
          <Field label="Current Score (nullable)" k="currentScore" type="number" />
        </CardContent>
      </Card>

      {/* ── Tabs de formularios ── */}
      <Tabs defaultValue="kyc" className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="kyc" className="text-xs">KYC</TabsTrigger>
          <TabsTrigger value="labor" className="text-xs">Laboral</TabsTrigger>
          <TabsTrigger value="economic" className="text-xs">Económico</TabsTrigger>
          <TabsTrigger value="references" className="text-xs">Referencias</TabsTrigger>
          <TabsTrigger value="address" className="text-xs">Dirección</TabsTrigger>
          <TabsTrigger value="bank" className="text-xs">Banco</TabsTrigger>
          <TabsTrigger value="intention" className="text-xs">Intención</TabsTrigger>
        </TabsList>

        <TabsContent value="kyc">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="DNI" k="dni" />
              <Field label="Código verificación" k="verificationCode" />
              <Field label="Fecha nacimiento" k="birthDate" />
              <Field label="Primer nombre" k="firstName" />
              <Field label="Segundo nombre" k="secondName" />
              <Field label="Primer apellido" k="firstLastName" />
              <Field label="Segundo apellido" k="secondLastName" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labor">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Situación laboral</label>
                <NativeSelect value={form.employmentStatus} onChange={e => updateForm('employmentStatus', e.target.value)} className="mt-1 h-8 text-sm">
                  {EMPLOYMENT_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Industria</label>
                <NativeSelect value={form.industry} onChange={e => updateForm('industry', e.target.value)} className="mt-1 h-8 text-sm">
                  {INDUSTRY_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <Field label="Años de actividad" k="yearsOfActivity" type="number" />
              <Field label="RUC (empresario)" k="businessRuc" />
              <Field label="Ingreso mensual (S/)" k="monthlyIncome" type="number" />
              <div>
                <label className="text-xs font-medium text-muted-foreground">Recibe ingresos por</label>
                <NativeSelect value={form.incomeReceiptMethod} onChange={e => updateForm('incomeReceiptMethod', e.target.value)} className="mt-1 h-8 text-sm">
                  {INCOME_RECEIPT_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economic">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Propósito del préstamo</label>
                <NativeSelect value={form.loanPurpose} onChange={e => updateForm('loanPurpose', e.target.value)} className="mt-1 h-8 text-sm">
                  {LOAN_PURPOSE_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <Field label="Gastos mensuales (S/)" k="monthlyExpenses" type="number" />
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nivel educativo</label>
                <NativeSelect value={form.educationLevel} onChange={e => updateForm('educationLevel', e.target.value)} className="mt-1 h-8 text-sm">
                  {EDUCATION_LEVEL_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <div className="flex items-center gap-4 col-span-full">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={form.hasDebts} onChange={e => updateForm('hasDebts', e.target.checked)} />
                  Tiene deudas
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={form.hasProperty} onChange={e => updateForm('hasProperty', e.target.checked)} />
                  Inmueble propio
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={form.hasVehicle} onChange={e => updateForm('hasVehicle', e.target.checked)} />
                  Vehículo propio
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={form.hasServices} onChange={e => updateForm('hasServices', e.target.checked)} />
                  Servicios a nombre
                </label>
              </div>
              {form.hasDebts && (
                <div className="col-span-full space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Deudas</p>
                    <Button
                      type="button" variant="outline" size="sm" className="h-6 text-xs"
                      onClick={() => updateForm('debts', [...form.debts, { entity: '', type: 'PERSONAL', amount: '', monthlyPayment: '' }])}
                    >
                      + Agregar deuda
                    </Button>
                  </div>
                  {form.debts.map((debt, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Entidad</label>
                        <Input className="h-7 text-xs" value={debt.entity} onChange={e => {
                          const updated = [...form.debts];
                          updated[i] = { ...updated[i], entity: e.target.value };
                          updateForm('debts', updated);
                        }} />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Tipo</label>
                        <Input className="h-7 text-xs" value={debt.type} onChange={e => {
                          const updated = [...form.debts];
                          updated[i] = { ...updated[i], type: e.target.value };
                          updateForm('debts', updated);
                        }} />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Saldo (S/)</label>
                        <Input className="h-7 text-xs" type="number" value={debt.amount} onChange={e => {
                          const updated = [...form.debts];
                          updated[i] = { ...updated[i], amount: e.target.value };
                          updateForm('debts', updated);
                        }} />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Cuota/mes (S/)</label>
                        <Input className="h-7 text-xs" type="number" value={debt.monthlyPayment} onChange={e => {
                          const updated = [...form.debts];
                          updated[i] = { ...updated[i], monthlyPayment: e.target.value };
                          updateForm('debts', updated);
                        }} />
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive"
                        onClick={() => updateForm('debts', form.debts.filter((_, idx) => idx !== i))}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Referencia Familiar</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Nombre" k="familyName" />
                  <Field label="Teléfono" k="familyPhone" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Relación</label>
                    <NativeSelect value={form.familyRelationship} onChange={e => updateForm('familyRelationship', e.target.value)} className="mt-1 h-8 text-sm">
                      <NativeSelectOption value="MADRE">Madre</NativeSelectOption>
                      <NativeSelectOption value="PADRE">Padre</NativeSelectOption>
                      <NativeSelectOption value="HERMANO">Hermano/a</NativeSelectOption>
                      <NativeSelectOption value="HIJO">Hijo/a</NativeSelectOption>
                      <NativeSelectOption value="CONYUGE">Cónyuge</NativeSelectOption>
                      <NativeSelectOption value="TIO">Tío/a</NativeSelectOption>
                      <NativeSelectOption value="PRIMO">Primo/a</NativeSelectOption>
                      <NativeSelectOption value="ABUELO">Abuelo/a</NativeSelectOption>
                      <NativeSelectOption value="OTRO">Otro</NativeSelectOption>
                    </NativeSelect>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Referencia No Familiar</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Nombre" k="nonFamilyName" />
                  <Field label="Teléfono" k="nonFamilyPhone" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Relación</label>
                    <NativeSelect value={form.nonFamilyRelationship} onChange={e => updateForm('nonFamilyRelationship', e.target.value)} className="mt-1 h-8 text-sm">
                      <NativeSelectOption value="COLEGA">Colega</NativeSelectOption>
                      <NativeSelectOption value="AMIGO">Amigo/a</NativeSelectOption>
                      <NativeSelectOption value="VECINO">Vecino/a</NativeSelectOption>
                      <NativeSelectOption value="CONOCIDO">Conocido/a</NativeSelectOption>
                      <NativeSelectOption value="OTRO">Otro</NativeSelectOption>
                    </NativeSelect>
                  </div>
                  <Field label="Años de conocidos" k="nonFamilyYearsKnown" type="number" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-full">
                <Field label="Dirección" k="streetAddress" />
              </div>
              <Field label="Región (código)" k="region" />
              <Field label="Provincia (código)" k="province" />
              <Field label="Distrito (código)" k="district" />
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cómo nos conociste</label>
                <NativeSelect value={form.referralSource} onChange={e => updateForm('referralSource', e.target.value)} className="mt-1 h-8 text-sm">
                  {REFERRAL_SOURCE_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Banco</label>
                <NativeSelect value={form.bankName} onChange={e => updateForm('bankName', e.target.value)} className="mt-1 h-8 text-sm">
                  <NativeSelectOption value="BCP">BCP</NativeSelectOption>
                  <NativeSelectOption value="INTERBANK">Interbank</NativeSelectOption>
                  <NativeSelectOption value="BBVA">BBVA</NativeSelectOption>
                  <NativeSelectOption value="SCOTIABANK">Scotiabank</NativeSelectOption>
                  <NativeSelectOption value="BN">Banco de la Nación</NativeSelectOption>
                  <NativeSelectOption value="BANBIF">BanBif</NativeSelectOption>
                  <NativeSelectOption value="PICHINCHA">Pichincha</NativeSelectOption>
                  <NativeSelectOption value="FALABELLA">Falabella</NativeSelectOption>
                  <NativeSelectOption value="RIPLEY">Ripley</NativeSelectOption>
                  <NativeSelectOption value="MIBANCO">MiBanco</NativeSelectOption>
                  <NativeSelectOption value="OTRO">Otro</NativeSelectOption>
                </NativeSelect>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo de cuenta</label>
                <NativeSelect value={form.accountType} onChange={e => updateForm('accountType', e.target.value)} className="mt-1 h-8 text-sm">
                  {ACCOUNT_TYPE_OPTIONS.map(o => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>
              <Field label="Últimos 4 dígitos cuenta" k="accountNumber" />
              <Field label="Últimos 4 dígitos CCI" k="cci" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intention">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Product ID" k="productId" />
              <Field label="Monto (S/)" k="amount" type="number" />
              <Field label="Plazo (días)" k="termDays" type="number" />
              <Field label="Cuotas" k="installmentCount" type="number" />
              <label className="flex items-center gap-2 text-xs col-span-full">
                <input type="checkbox" checked={form.isFirstLoan} onChange={e => updateForm('isFirstLoan', e.target.checked)} />
                Es primer préstamo
              </label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Acciones ── */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={invoke} disabled={loading} className="gap-2">
          <Play className="w-4 h-4" />
          {loading ? 'Invocando...' : 'Invocar Lambda'}
        </Button>
        <Button variant="outline" onClick={save} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar
        </Button>
        <Button variant="outline" onClick={copyPayload} className="gap-2">
          <Copy className="w-4 h-4" />
          Copiar Payload
        </Button>
        <Button
          variant="outline"
          onClick={() => setPayloadPreview(payloadPreview ? null : JSON.stringify(buildPayload(form), null, 2))}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {payloadPreview ? 'Ocultar' : 'Ver'} Payload
        </Button>
        <Button variant="outline" onClick={downloadCurrent} disabled={!result} className="gap-2">
          <Download className="w-4 h-4" />
          Descargar último
        </Button>
        <Button variant="outline" onClick={downloadAll} disabled={resultHistory.length === 0} className="gap-2">
          <Download className="w-4 h-4" />
          Descargar todo ({resultHistory.length})
        </Button>
        <Button variant="ghost" onClick={reset} className="gap-2 text-muted-foreground">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* ── Preview del payload ── */}
      {payloadPreview && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold">Payload Preview</h3>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-96 font-mono">
              {payloadPreview}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── Resultado ── */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Resultado</h3>
              <Badge variant={result.statusCode === 202 || result.statusCode === 200 ? 'success' : 'destructive'}>
                {result.statusCode ?? 'Error'}
              </Badge>
              {result.payload?.body?.scoring && (
                <Badge variant={result.payload.body.scoring.decision === 'APPROVED' ? 'success' : 'destructive'}>
                  {result.payload.body.scoring.decision} — Score: {result.payload.body.scoring.finalScore}/100
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Resumen rápido si hay scoring */}
            {result.payload?.body?.scoring && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium">
                  {result.payload.body.result.passed ? '✅ Aprobado' : '❌ Rechazado'}
                  {' — '}{result.payload.body.result.detail}
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.payload.body.scoring.appliedFactors?.map((f: any, i: number) => (
                    <Badge key={i} variant={f.points > 0 ? 'success' : 'destructive'} className="text-[10px]">
                      {f.points > 0 ? '+' : ''}{f.points} {f.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-80 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── Historial ── */}
      {resultHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Historial ({resultHistory.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => { setResultHistory([]); localStorage.removeItem(RESULTS_KEY); toast.info('Historial limpiado'); }}
              >
                Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {resultHistory.map((entry, i) => (
              <button
                key={i}
                onClick={() => setResult(entry)}
                className="w-full text-left p-2 rounded hover:bg-muted/50 flex items-center gap-2 text-xs"
              >
                <Badge variant={entry.statusCode === 200 || entry.statusCode === 202 ? 'success' : 'destructive'} className="text-[10px]">
                  {entry.statusCode ?? 'ERR'}
                </Badge>
                <span className="text-muted-foreground">{entry._timestamp?.slice(11, 19)}</span>
                {entry.payload?.body?.scoring && (
                  <span className="font-medium">
                    Score: {entry.payload.body.scoring.finalScore} → {entry.payload.body.scoring.decision}
                  </span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
