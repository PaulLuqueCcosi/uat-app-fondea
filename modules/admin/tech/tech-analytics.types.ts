/**
 * Tipos para la sección Tecnología y APIs (M8 — R45, R46, R48).
 * Endpoints: /api/v1/admin/tech/analytics/*
 *
 * R47 (backup de BD) no tiene endpoint todavía — no existe la estrategia de
 * backup en infraestructura, ver módulo de backups cuando se construya.
 */

// ── R45 — Tiempo de procesamiento del KYC ─────────────────────────────────────

export interface KycProcessingApplicationEntry {
  applicationId: string;
  totalProcessingSeconds: number;
  lastAttemptAt: string;
}

export interface KycProcessingApplicationEntryBackend {
  application_id: string;
  total_processing_seconds: number;
  last_attempt_at: string;
}

export interface KycProcessingTime {
  periodAvgSeconds: number;
  periodMaxSeconds: number;
  applications: KycProcessingApplicationEntry[];
}

export interface KycProcessingTimeBackend {
  period_avg_seconds: number;
  period_max_seconds: number;
  applications: KycProcessingApplicationEntryBackend[];
}

// ── R46 — Estado de APIs externas ─────────────────────────────────────────────

export type ApiHealthStatus = 'OK' | 'ERROR' | 'SIN_DATOS';

export interface ApiStatusEntry {
  api: string;
  status: ApiHealthStatus;
  lastCheckedAt: string | null;
}

export interface ApiStatusEntryBackend {
  api: string;
  status: ApiHealthStatus;
  last_checked_at: string | null;
}

export interface ApiStatus {
  apis: ApiStatusEntry[];
}

export interface ApiStatusBackend {
  apis: ApiStatusEntryBackend[];
}

// ── R48 — Tiempo de desembolso ────────────────────────────────────────────────

export interface DisbursementTimeEntry {
  creditId: string;
  signedAt: string;
  disbursedAt: string;
  minutesElapsed: number;
}

export interface DisbursementTimeEntryBackend {
  credit_id: string;
  signed_at: string;
  disbursed_at: string;
  minutes_elapsed: number;
}

export interface DisbursementTime {
  periodAvgMinutes: number;
  periodMaxMinutes: number;
  credits: DisbursementTimeEntry[];
}

export interface DisbursementTimeBackend {
  period_avg_minutes: number;
  period_max_minutes: number;
  credits: DisbursementTimeEntryBackend[];
}
