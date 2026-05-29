/**
 * Rango de score crediticio del producto.
 * Proviene de GET /api/products/{id}/options → scoreRanges
 */
export interface ScoreRange {
  code: string;
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  displayOrder: number;
}
