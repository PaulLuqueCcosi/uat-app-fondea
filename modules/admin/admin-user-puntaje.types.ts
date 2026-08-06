/**
 * Tipos para el pasaporte de fidelización ("puntaje") de un usuario — vista admin.
 * OJO: esto NO es el score crediticio (0-1000, módulo `scoring`) — es el sistema de
 * puntos de lealtad BRONCE/PLATA/ORO/MASTER (módulo `puntaje`). Son dominios distintos.
 *
 * Mapea la respuesta del backend de:
 * - GET /api/v1/admin/score/users/{userId}
 * - GET /api/v1/admin/score/users/{userId}/historial
 * - GET /api/v1/score/rangos (no requiere userId — config global de rangos activos)
 */

export interface AdminUserPuntajeBackend {
  points: number;
  maxLoanAmount: number;
  categoryName: string;
}

export interface AdminUserPuntaje {
  points: number;
  maxLoanAmount: number;
  categoryName: string;
}

export interface PuntajeTransactionBackend {
  id: string;
  points: number;
  type: string;
  reason: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface PuntajeTransaction {
  id: string;
  points: number;
  type: string;
  reason: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface PuntajeRangoBackend {
  id: string;
  categoryName: string;
  imageUrl: string | null;
  minPoints: number;
  maxPoints: number | null;
  maxLoanAmount: number;
}

export interface PuntajeRango {
  id: string;
  categoryName: string;
  imageUrl: string | null;
  minPoints: number;
  maxPoints: number | null;
  maxLoanAmount: number;
}
