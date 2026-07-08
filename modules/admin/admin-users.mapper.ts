/**
 * Mapper: Backend AdminUserSummaryResponse → Frontend AdminUserRow.
 */

import type { AdminUserSummaryBackend, AdminUserRow } from './admin-users.types';

/**
 * Construye el nombre completo a partir de las partes.
 * Formato: "Juan Carlos García López"
 */
function buildFullName(raw: AdminUserSummaryBackend): string {
  const parts: string[] = [];
  if (raw.firstName) parts.push(raw.firstName);
  if (raw.secondName) parts.push(raw.secondName);
  if (raw.additionalNames) parts.push(raw.additionalNames);
  if (raw.paternalSurname) parts.push(raw.paternalSurname);
  if (raw.maternalSurname) parts.push(raw.maternalSurname);
  return parts.length > 0 ? parts.join(' ') : '(Sin nombre)';
}

export function mapUserFromBackend(raw: AdminUserSummaryBackend): AdminUserRow {
  return {
    id: raw.id,
    name: buildFullName(raw),
    documentType: raw.documentType ?? null,
    documentNumber: raw.documentNumber ?? null,
    registeredAt: raw.createdAt,
  };
}
