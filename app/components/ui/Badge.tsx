import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'pending'
  | 'completed'
  | 'blocked'
  | 'warning'
  | 'active'
  | 'evaluating'
  | 'rejected'
  | 'disbursing'
  | 'success'
  | 'error';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const config: Record<BadgeVariant, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  pending:    { bg: 'bg-[#FFF8F0]', text: 'text-warning',    dot: 'bg-warning',   defaultLabel: 'Pendiente' },
  completed:  { bg: 'bg-[#F0FFF4]', text: 'text-[#16a34a]',  dot: 'bg-secondary', defaultLabel: 'Completado' },
  blocked:    { bg: 'bg-[#FEF2F2]', text: 'text-error',       dot: 'bg-error',     defaultLabel: 'Bloqueado' },
  warning:    { bg: 'bg-[#FFF8F0]', text: 'text-warning',    dot: 'bg-warning',   defaultLabel: 'Advertencia' },
  active:     { bg: 'bg-[#F0FAFE]', text: 'text-primary',    dot: 'bg-primary',   defaultLabel: 'Activo' },
  evaluating: { bg: 'bg-[#FFF8F0]', text: 'text-warning',    dot: 'bg-warning',   defaultLabel: 'En evaluación' },
  rejected:   { bg: 'bg-[#FEF2F2]', text: 'text-error',       dot: 'bg-error',     defaultLabel: 'Rechazado' },
  disbursing: { bg: 'bg-[#F0FAFE]', text: 'text-primary',    dot: 'bg-primary',   defaultLabel: 'Desembolso en proceso' },
  success:    { bg: 'bg-[#F0FFF4]', text: 'text-[#16a34a]',  dot: 'bg-secondary', defaultLabel: 'Éxito' },
  error:      { bg: 'bg-[#FEF2F2]', text: 'text-error',       dot: 'bg-error',     defaultLabel: 'Error' },
};

export const Badge: React.FC<BadgeProps> = ({ variant, label, className }) => {
  const c = config[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        c.bg,
        c.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot)} />
      {label ?? c.defaultLabel}
    </span>
  );
};
