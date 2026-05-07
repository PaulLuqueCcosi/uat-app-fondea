// ─── UI Types ────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'disabled' | 'danger';

export type BadgeStatus = 'pending' | 'completed' | 'blocked' | 'warning' | 'active' | 'evaluating' | 'rejected' | 'disbursing';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export type StepState = 'completed' | 'active' | 'pending';

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

export interface FunnelStep {
  id: number;
  label: string;
  state: StepState;
}
