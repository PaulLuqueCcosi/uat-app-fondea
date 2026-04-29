'use server';

import { requireValidSession } from './auth.actions';
import { ApplicationRecord, EvaluationResult } from '@/lib/types';
import { generateId } from '@/lib/utils';
import fs from 'fs/promises';
import path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const APPLICATIONS_DB = path.join(process.cwd(), 'mock-db', 'applications.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readDB(): Promise<Record<string, ApplicationRecord>> {
  try {
    return JSON.parse(await fs.readFile(APPLICATIONS_DB, 'utf-8'));
  } catch {
    return {};
  }
}

async function writeDB(data: Record<string, ApplicationRecord>): Promise<void> {
  await fs.writeFile(APPLICATIONS_DB, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Envía la solicitud de préstamo.
 * Crea el registro en el mock-db con status "evaluating" y dispara la evaluación
 * en background (simulada con un setTimeout en el servidor).
 *
 * TODO: reemplazar por:
 *   const res = await fetch(`${process.env.API_URL}/applications`, {
 *     method: 'POST',
 *     headers: { ...authHeaders, 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ pep_declarations }),
 *   });
 *   const data = await res.json();
 *   return { success: true, applicationId: data.id };
 */
export async function submitApplicationAction(pepDeclarations: {
  not_pep: boolean;
  not_pep_relative: boolean;
  accept_terms: boolean;
}): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  const user = await requireValidSession();

  try {
    const db = await readDB();

    // Verificar si ya tiene una solicitud activa
    const existing = Object.values(db).find(
      (a) => a.userId === user.id && ['submitted', 'evaluating'].includes(a.status)
    );
    if (existing) {
      return { success: true, applicationId: existing.id };
    }

    const applicationId = generateId();
    const now = new Date().toISOString();

    db[applicationId] = {
      id: applicationId,
      userId: user.id,
      status: 'evaluating',
      submittedAt: now,
    };

    await writeDB(db);

    // Simula evaluación asíncrona en background (5 segundos)
    // En producción el backend hace esto — aquí solo actualizamos el mock
    setTimeout(async () => {
      try {
        const freshDb = await readDB();
        if (!freshDb[applicationId]) return;

        // Mock: 70% aprobado, 30% rechazado
        const result: EvaluationResult = Math.random() > 0.3 ? 'approved' : 'rejected';
        const evaluatedAt = new Date().toISOString();
        const canRetryAt = result === 'rejected'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        freshDb[applicationId] = {
          ...freshDb[applicationId],
          status: result === 'approved' ? 'approved' : 'rejected',
          result,
          evaluatedAt,
          canRetryAt,
        };

        await writeDB(freshDb);
        console.log(`[APPLICATION] Evaluación completada: ${applicationId} → ${result}`);
      } catch (e) {
        console.error('[APPLICATION] Error en evaluación background:', e);
      }
    }, 5000);

    console.log('[APPLICATION] Solicitud enviada:', applicationId);
    return { success: true, applicationId };
  } catch (error) {
    console.error('[APPLICATION] Error al enviar:', error);
    return { success: false, error: 'Error al enviar la solicitud. Intenta nuevamente.' };
  }
}

/**
 * Consulta el estado actual de una solicitud (polling).
 *
 * TODO: reemplazar por:
 *   const res = await fetch(`${process.env.API_URL}/applications/${applicationId}/status`, {
 *     headers: authHeaders,
 *   });
 *   return res.json();
 */
export async function getApplicationStatusAction(applicationId: string): Promise<{
  status: string;
  result?: EvaluationResult;
  canRetryAt?: string;
} | null> {
  const user = await requireValidSession();

  try {
    const db = await readDB();
    const app = db[applicationId];

    // Seguridad: solo el dueño puede consultar
    if (!app || app.userId !== user.id) return null;

    return {
      status: app.status,
      result: app.result,
      canRetryAt: app.canRetryAt,
    };
  } catch {
    return null;
  }
}
