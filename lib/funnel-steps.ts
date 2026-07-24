import {
  Briefcase,
  DollarSign,
  Users,
  MapPin,
  Building2,
  FileText,
  Clock,
  CreditCard,
  Camera,
  FileSignature,
  type LucideIcon,
} from 'lucide-react';

export interface FunnelStep {
  id: number;
  title: string;
  path: string;
  icon: LucideIcon;
  description: string;
  nextPath?: string;
}

export const FUNNEL_STEPS: FunnelStep[] = [
  {
    id: 0,
    title: 'Verificación de Identidad',
    path: '/solicitar/kyc-validation',
    icon: CreditCard,
    description: 'Validar datos del DNI',
    nextPath: '/solicitar/labor',
  },
  {
    id: 1,
    title: 'Perfil Laboral',
    path: '/solicitar/labor',
    icon: Briefcase,
    description: 'Información de trabajo',
    nextPath: '/solicitar/economic',
  },
  {
    id: 2,
    title: 'Perfil Económico',
    path: '/solicitar/economic',
    icon: DollarSign,
    description: 'Ingresos y gastos',
    nextPath: '/solicitar/references',
  },
  {
    id: 3,
    title: 'Referencias',
    path: '/solicitar/references',
    icon: Users,
    description: 'Contactos de referencia',
    nextPath: '/solicitar/additional',
  },
  {
    id: 4,
    title: 'Dirección',
    path: '/solicitar/additional',
    icon: MapPin,
    description: 'Dirección y más',
    nextPath: '/solicitar/bank-account',
  },
  {
    id: 5,
    title: 'Cuenta Bancaria',
    path: '/solicitar/bank-account',
    icon: Building2,
    description: 'Datos de desembolso',
    nextPath: '/solicitar/summary',
  },
  {
    id: 6,
    title: 'Resumen',
    path: '/solicitar/summary',
    icon: FileText,
    description: 'Revisar y enviar',
    nextPath: '/solicitar/waiting',
  },
  // {
  //   id: 7,
  //   title: 'Evaluación',
  //   path: '/solicitar/waiting',
  //   icon: Clock,
  //   description: 'Esperando resultado',
  //   nextPath: '/solicitar/kyc-documents',
  // },
  // {
  //   id: 8,
  //   title: 'Documentos DNI',
  //   path: '/solicitar/kyc-documents',
  //   icon: CreditCard,
  //   description: 'Verificación de identidad',
  //   nextPath: '/solicitar/kyc-selfie',
  // },
  // {
  //   id: 9,
  //   title: 'Selfie',
  //   path: '/solicitar/kyc-selfie',
  //   icon: Camera,
  //   description: 'Verificación biométrica',
  //   nextPath: '/solicitar/contract',
  // },
  // {
  //   id: 10,
  //   title: 'Contrato',
  //   path: '/solicitar/contract',
  //   icon: FileSignature,
  //   description: 'Firmar contrato',
  //   nextPath: '/solicitar/contract-signed',
  // },
];

export function getCurrentStep(pathname: string): FunnelStep | undefined {
  return FUNNEL_STEPS.find(step => pathname === step.path);
}

export function getStepByPath(path: string): FunnelStep | undefined {
  return FUNNEL_STEPS.find(step => step.path === path);
}

export function getCurrentStepIndex(pathname: string): number {
  const index = FUNNEL_STEPS.findIndex(step => pathname === step.path);
  return index !== -1 ? index : 0;
}

export function getNextStep(pathname: string): FunnelStep | undefined {
  const currentIndex = getCurrentStepIndex(pathname);
  return FUNNEL_STEPS[currentIndex + 1];
}

export function getPreviousStep(pathname: string): FunnelStep | undefined {
  const currentIndex = getCurrentStepIndex(pathname);
  return currentIndex > 0 ? FUNNEL_STEPS[currentIndex - 1] : undefined;
}

export function getVisibleSteps(pathname: string): FunnelStep[] {
  const currentIndex = getCurrentStepIndex(pathname);

  // Mostrar: todos los pasos anteriores + paso actual + siguiente paso
  const steps: FunnelStep[] = [];

  // Todos los pasos anteriores (completados)
  for (let i = 0; i < currentIndex; i++) {
    steps.push(FUNNEL_STEPS[i]);
  }

  // Paso actual
  if (currentIndex >= 0 && currentIndex < FUNNEL_STEPS.length) {
    steps.push(FUNNEL_STEPS[currentIndex]);
  }

  // Siguiente paso (solo el inmediato siguiente)
  if (currentIndex + 1 < FUNNEL_STEPS.length) {
    steps.push(FUNNEL_STEPS[currentIndex + 1]);
  }

  return steps;
}
