'use client';

import Link from 'next/link';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';

/**
 * Listado de Créditos — Todos los préstamos desembolsados del usuario.
 * TODO: Conectar con API real.
 */

interface Credit {
  id: string;
  amount: number;
  disbursedDate: string;
  totalInstallments: number;
  paidInstallments: number;
  pendingBalance: number;
  nextDueDate: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
}

const mockCredits: Credit[] = [
  {
    id: 'cred-001',
    amount: 1500,
    disbursedDate: '2026-04-25',
    totalInstallments: 4,
    paidInstallments: 1,
    pendingBalance: 1125,
    nextDueDate: '2026-06-25',
    status: 'ACTIVE',
  },
  {
    id: 'cred-002',
    amount: 800,
    disbursedDate: '2025-11-10',
    totalInstallments: 3,
    paidInstallments: 3,
    pendingBalance: 0,
    nextDueDate: null,
    status: 'COMPLETED',
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Credit['status'] }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant="success" className="gap-1">
          <Clock className="w-3 h-3" />
          Activo
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="completed" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          Completado
        </Badge>
      );
    case 'OVERDUE':
      return (
        <Badge variant="error" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Vencido
        </Badge>
      );
  }
}

export default function CreditosPage() {
  const activeCredits = mockCredits.filter((c) => c.status === 'ACTIVE');
  const completedCredits = mockCredits.filter((c) => c.status === 'COMPLETED');

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PageTitle
        title="Mis Créditos"
        description="Todos tus préstamos desembolsados. Revisa el estado, cuotas y comprobantes."
      />

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Créditos activos</p>
            <p className="text-2xl font-bold text-primary">{activeCredits.length}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Completados</p>
            <p className="text-2xl font-bold text-success-700">{completedCredits.length}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-3">
            <p className="text-[10px] text-muted-foreground">Saldo total pendiente</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(mockCredits.reduce((sum, c) => sum + c.pendingBalance, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de créditos */}
      <div className="space-y-3">
        {mockCredits.map((credit) => {
          const progress = Math.round(
            (credit.paidInstallments / credit.totalInstallments) * 100
          );

          return (
            <Link key={credit.id} href={`/dashboard/creditos/${credit.id}`} className="block group">
              <Card className="transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {/* Icono */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      credit.status === 'ACTIVE'
                        ? 'bg-primary/10'
                        : credit.status === 'COMPLETED'
                        ? 'bg-success-50'
                        : 'bg-error-50'
                    }`}>
                      <CreditCard className={`w-5 h-5 ${
                        credit.status === 'ACTIVE'
                          ? 'text-primary'
                          : credit.status === 'COMPLETED'
                          ? 'text-success-600'
                          : 'text-error-500'
                      }`} />
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(credit.amount)}
                        </p>
                        <StatusBadge status={credit.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Desembolsado: {formatDate(credit.disbursedDate)}</span>
                        <span>·</span>
                        <span>{credit.paidInstallments}/{credit.totalInstallments} cuotas</span>
                      </div>
                      {/* Barra de progreso */}
                      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 mt-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            credit.status === 'COMPLETED' ? 'bg-success-500' : 'bg-primary'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Flecha */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
