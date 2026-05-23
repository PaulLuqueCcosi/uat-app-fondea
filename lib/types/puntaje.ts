/**
 * Score del usuario — puntaje del sistema que determina su límite de préstamo.
 * NO es Score Crediticio (eso es diferente).
 * Se obtiene de: GET /api/v1/score
 */
export interface PuntajeConfig {
  points: number;        // Puntaje del sistema
  maxLoanAmount: number; // Límite máximo de préstamo basado en el puntaje
}
