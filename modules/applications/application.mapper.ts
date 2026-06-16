/**
 * Mapper: respuesta del backend (snake_case) → tipos del frontend (camelCase).
 */

import type { ApplicationRecord } from './application.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApplicationFromBackend(data: any): ApplicationRecord {
  return {
    id: data.id,
    status: data.status,
    submittedAt: data.submitted_at ?? data.submittedAt ?? undefined,
    evaluatedAt: data.evaluated_at ?? data.evaluatedAt ?? undefined,
    creditScore: data.credit_score ?? data.creditScore ?? undefined,
    rejectionReason: data.rejection_reason ?? data.rejectionReason ?? undefined,
    canRetryAt: data.can_retry_at ?? data.canRetryAt ?? undefined,
    failureCode: data.failure_code ?? data.failureCode ?? undefined,
  };
}
