'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Briefcase, DollarSign, Users, MapPin,
  X, ArrowRight, BookOpen, Settings, User, Bell,
  ChevronRight, ClipboardList, FileText, Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExpedienteSection {
  id: string;
  num: number;
  icon: React.ElementType;
  title: string;
  status: 'pending' | 'completed';
  path: string;
}

interface Article {
  title: string;
  description: string;
}

const expedienteSections: ExpedienteSection[] = [
  { id: 'kyc', num: 1, icon: CreditCard, title: 'Verificación KYC', status: 'pending', path: '/dashboard/section/kyc' },
  { id: 'labor', num: 2, icon: Briefcase, title: 'Perfil Laboral', status: 'pending', path: '/dashboard/section/labor' },
  { id: 'economic', num: 3, icon: DollarSign, title: 'Perfil Económico', status: 'pending', path: '/dashboard/section/economic' },
  { id: 'references', num: 4, icon: Users, title: 'Referencias', status: 'completed', path: '/dashboard/section/references' },
  { id: 'additional', num: 5, icon: MapPin, title: 'Info Adicional', status: 'pending', path: '/dashboard/section/additional' },
];

const articles: Article[] = [
  { title: '¿Qué es el score crediticio?', description: 'Aprende cómo se calcula y cómo mejorarlo para acceder a mejores tasas.' },
  { title: 'Cómo usar un préstamo personal', description: 'Consejos para usar el crédito de forma responsable y sin endeudarte.' },
  { title: 'Diferencia entre TEA y TCEA', description: 'Entiende las tasas que aplican a tu préstamo antes de firmar.' },
];

const profileIsComplete = false;
const progress = 20;

interface DashboardHomeClientProps {
  userName: string;
}

export function DashboardHomeClient({ userName }: DashboardHomeClientProps) {
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);

  const completedCount = expedienteSections.filter(s => s.status === 'completed').length;

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Hola, {userName}</h1>
            <p className="text-sm sm:text-base text-fondea-text">Completa tu expediente para solicitar tu primer préstamo</p>
          </div>
          <button
            onClick={() => router.push('/funnel/labor')}
            className="flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Pedir préstamo
          </button>
        </div>

        {/* Progress bar */}
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-dark">Tu perfil está {progress}% completo</span>
              <span className="text-sm text-fondea-text">{progress}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-fondea-text">
              {completedCount} de {expedienteSections.length} secciones completadas
            </p>
          </div>
        </Card>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
            {/* Mi Expediente */}
            <Card>
              <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Mi Expediente</h2>
                <span className="ml-auto text-xs text-fondea-text">{completedCount}/{expedienteSections.length} completados</span>
              </div>
              <div className="divide-y divide-border">
                {expedienteSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        section.status === 'completed'
                          ? 'bg-secondary/20 text-[#16a34a]'
                          : 'bg-[#F0FAFE] text-primary'
                      )}>
                        {section.num}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={cn(
                          'text-xs sm:text-sm truncate',
                          section.status === 'completed' ? 'text-fondea-text line-through' : 'text-dark font-medium'
                        )}>
                          {section.title}
                        </span>
                      </div>
                      <Badge
                        variant={section.status === 'completed' ? 'completed' : 'pending'}
                        className="flex-shrink-0 hidden sm:flex"
                      />
                      <button
                        onClick={() => router.push(section.path)}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 flex-shrink-0"
                      >
                        <span className="hidden sm:inline">{section.status === 'completed' ? 'Editar' : 'Completar'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Mis Solicitudes */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Mis Solicitudes</h2>
              </div>
              <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                  <FileText className="w-6 h-6 text-fondea-text" />
                </div>
                <p className="text-sm text-fondea-text">Aún no tienes solicitudes activas</p>
                <button
                  onClick={() => profileIsComplete ? router.push('/dashboard/loans') : setShowDrawer(true)}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                >
                  {profileIsComplete ? 'Solicitar préstamo' : 'Ver qué falta para solicitar'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            {/* Solicitar Préstamo */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  profileIsComplete ? 'bg-secondary' : 'bg-border'
                )}>
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Solicitar Préstamo</h2>
              </div>
              <div className="px-5 py-5 flex flex-col gap-3">
                {profileIsComplete ? (
                  <>
                    <p className="text-sm text-fondea-text">Tu perfil está completo. ¡Ya puedes solicitar!</p>
                    <button
                      onClick={() => router.push('/dashboard/loans')}
                      className="w-full bg-secondary text-dark font-semibold text-sm py-2.5 rounded-lg hover:bg-secondary/90 transition-colors"
                    >
                      Solicitar ahora
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-fondea-text">Completa tu expediente para desbloquear esta función.</p>
                    <button
                      onClick={() => setShowDrawer(true)}
                      className="w-full flex items-center justify-between text-sm text-primary font-medium border border-border rounded-lg px-4 py-2.5 hover:bg-[#F0FAFE] transition-colors"
                    >
                      <span>Ver qué falta</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </Card>

            {/* Educación Financiera */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Aprende sobre finanzas</h2>
              </div>
              <div className="divide-y divide-border">
                {articles.map((article) => (
                  <div key={article.title} className="px-5 py-3 flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-dark">{article.title}</p>
                    <p className="text-xs text-fondea-text leading-relaxed">{article.description}</p>
                    <button className="text-xs text-primary font-medium hover:underline self-start mt-1">
                      Leer →
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Configuración rápida */}
            <Card>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-dark">Configuración rápida</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: 'Mi Perfil', icon: User, path: '/dashboard/profile' },
                  { label: 'Seguridad', icon: Settings, path: '/dashboard/settings' },
                  { label: 'Notificaciones', icon: Bell, path: '/dashboard/settings' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => router.push(item.path)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-background transition-colors"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-dark">
                        <Icon className="w-4 h-4 text-fondea-text" />
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-fondea-text" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDrawer(false)} />
          <div className="relative bg-white w-full sm:w-96 md:w-80 h-full shadow-xl p-5 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark text-lg">Qué falta para solicitar</h3>
              <button onClick={() => setShowDrawer(false)}>
                <X className="w-5 h-5 text-fondea-text" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Datos básicos', done: true, path: undefined },
                { label: 'KYC', done: false, path: '/dashboard/section/kyc' },
                { label: 'Perfil laboral', done: false, path: '/dashboard/section/labor' },
                { label: 'Perfil económico', done: false, path: '/dashboard/section/economic' },
                { label: 'Referencias', done: true, path: undefined },
                { label: 'Info adicional', done: false, path: '/dashboard/section/additional' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={item.done ? 'text-secondary' : 'text-warning'}>
                      {item.done ? '✓' : '⏳'}
                    </span>
                    <span className="text-sm text-dark">{item.label}</span>
                  </div>
                  {!item.done && item.path && (
                    <button
                      onClick={() => { setShowDrawer(false); router.push(item.path); }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Completar <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
