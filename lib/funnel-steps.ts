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
    id: 1,
    title: 'Perfil Laboral',
    path: '/funnel/labor',
    icon: Briefcase,
    description: 'Información de trabajo',
    nextPath: '/funnel/economic',
  },
  {
    id: 2,
    title: 'Perfil Económico',
    path: '/funnel/economic',
    icon: DollarSign,
    description: 'Ingresos y gastos',
    nextPath: '/funnel/references',
  },
  {
    id: 3,
    title: 'Referencias',
    path: '/funnel/references',
    icon: Users,
    description: 'Contactos de referencia',
    nextPath: '/funnel/additional',
  },
  {
    id: 4,
    title: 'Info Adicional',
    path: '/funnel/additional',
    icon: MapPin,
    description: 'Dirección y más',
    nextPath: '/funnel/bank-account',
  },
  {
    id: 5,
    title: 'Cuenta Bancaria',
    path: '/funnel/bank-account',
    icon: Building2,
    description: 'Datos de desembolso',
    nextPath: '/funnel/summary',
  },
  {
    id: 6,
    title: 'Resumen',
    path: '/funnel/summary',
    icon: FileText,
    description: 'Revisar y enviar',
    nextPath: '/funnel/waiting',
  },
  // {
  //   id: 7,
  //   title: 'Evaluación',
  //   path: '/funnel/waiting',
  //   icon: Clock,
  //   description: 'Esperando resultado',
  //   nextPath: '/funnel/kyc-documents',
  // },
  // {
  //   id: 8,
  //   title: 'Documentos DNI',
  //   path: '/funnel/kyc-documents',
  //   icon: CreditCard,
  //   description: 'Verificación de identidad',
  //   nextPath: '/funnel/kyc-selfie',
  // },
  // {
  //   id: 9,
  //   title: 'Selfie',
  //   path: '/funnel/kyc-selfie',
  //   icon: Camera,
  //   description: 'Verificación biométrica',
  //   nextPath: '/funnel/contract',
  // },
  // {
  //   id: 10,
  //   title: 'Contrato',
  //   path: '/funnel/contract',
  //   icon: FileSignature,
  //   description: 'Firmar contrato',
  //   nextPath: '/funnel/contract-signed',
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
