/**
 * POST /api/dev/invoke-lambda
 *
 * ⚠️ TEMPORAL — BORRAR DESPUÉS DE PROBAR ⚠️
 *
 * Proxy para invocar la Lambda de business validation desde el frontend.
 * SOLO PARA DESARROLLO — no exponer en producción.
 *
 * Recibe las credenciales AWS y el payload en el body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export async function POST(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      accessKeyId,
      secretAccessKey,
      region = 'us-east-1',
      functionName = 'fondea-business-validation-dev',
      invocationType = 'Event', // Event = async (202), RequestResponse = sync
      payload,
    } = body;

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { error: 'Missing AWS credentials (accessKeyId, secretAccessKey)' },
        { status: 400 },
      );
    }

    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const client = new LambdaClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: invocationType,
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await client.send(command);

    // Decodificar el payload de respuesta si existe
    let responsePayload = null;
    if (response.Payload) {
      const decoded = Buffer.from(response.Payload).toString('utf-8');
      try {
        responsePayload = JSON.parse(decoded);
      } catch {
        responsePayload = decoded;
      }
    }

    return NextResponse.json({
      statusCode: response.StatusCode,
      functionError: response.FunctionError ?? null,
      logResult: response.LogResult
        ? Buffer.from(response.LogResult, 'base64').toString('utf-8')
        : null,
      payload: responsePayload,
      executedVersion: response.ExecutedVersion ?? null,
    });
  } catch (error: any) {
    console.error('[API] POST /api/dev/invoke-lambda → error:', error);
    return NextResponse.json(
      {
        error: error.message ?? 'Unknown error',
        name: error.name ?? 'Error',
        code: error.Code ?? error.code ?? null,
      },
      { status: 500 },
    );
  }
}
