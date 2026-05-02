'use client';

import { useState } from 'react';

interface ValidationResult {
  success: boolean;
  localSession: boolean;
  serverValidation: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  tokenInfo?: {
    length: number;
    validationTimeMs: number;
  };
  errorDetails?: {
    message: string;
    code?: string;
    status?: number;
  };
}

export default function ServerValidationTest() {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [introspectResult, setIntrospectResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [introspectLoading, setIntrospectLoading] = useState(false);

  const testServerValidation = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/validate-token-direct');
      const data: ValidationResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        localSession: false,
        serverValidation: false,
        error: `Error de red: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const testTokenIntrospection = async () => {
    setIntrospectLoading(true);
    setIntrospectResult(null);

    try {
      const response = await fetch('/api/test/introspect-token');
      const data = await response.json();
      setIntrospectResult(data);
    } catch (error) {
      setIntrospectResult({
        success: false,
        error: `Error de red: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIntrospectLoading(false);
    }
  };

  const getResultBg = () => {
    if (!result) return 'bg-neutral-100';
    if (result.success && result.serverValidation) return 'bg-success-50 border-success-200';
    if (result.localSession && !result.serverValidation) return 'bg-warning-50 border-warning-200';
    return 'bg-error-50 border-error-200';
  };

  const getStatusIcon = () => {
    if (!result) return '❓';
    if (result.success && result.serverValidation) return '✅';
    if (result.localSession && !result.serverValidation) return '⚠️';
    return '❌';
  };

  return (
    <div className="mt-6">
      <div className="space-x-4">
        <button
          onClick={testServerValidation}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? '🔄 Probando...' : '🔍 Probar Validación Servidor'}
        </button>

        <button
          onClick={testTokenIntrospection}
          disabled={introspectLoading}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90 disabled:opacity-50"
        >
          {introspectLoading ? '🔄 Analizando...' : '🔬 Introspección Profunda'}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded border-2 ${getResultBg()}`}>
          <h3 className="font-bold flex items-center gap-2">
            {getStatusIcon()} Resultado de Validación Servidor
          </h3>

          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Sesión Local:</strong>
                <span className={result.localSession ? 'text-success-600' : 'text-error-600'}>
                  {result.localSession ? ' ✓ Válida' : ' ✗ Inválida'}
                </span>
              </div>
              <div>
                <strong>Validación Servidor:</strong>
                <span className={result.serverValidation ? 'text-success-600' : 'text-error-600'}>
                  {result.serverValidation ? ' ✓ Válida' : ' ✗ Inválida'}
                </span>
              </div>
            </div>

            {result.message && (
              <p className="text-sm font-medium">{result.message}</p>
            )}

            {result.error && (
              <p className="text-sm text-error-600 font-medium">Error: {result.error}</p>
            )}

            {result.user && (
              <div className="text-sm">
                <strong>Usuario:</strong> {result.user.name} ({result.user.email})
              </div>
            )}

            {result.tokenInfo && (
              <div className="text-sm">
                <strong>Token:</strong> {result.tokenInfo.length} chars, validado en {result.tokenInfo.validationTimeMs}ms
              </div>
            )}

            {result.errorDetails && (
              <div className="text-sm text-error-600">
                <strong>Detalles del error:</strong> {result.errorDetails.message}
                {result.errorDetails.code && ` (${result.errorDetails.code})`}
              </div>
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-muted-foreground">Ver respuesta completa</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {introspectResult && (
        <div className={`mt-4 p-4 rounded border-2 ${introspectResult.success ? 'bg-primary-50 border-primary-200' : 'bg-error-50 border-error-200'}`}>
          <h3 className="font-bold flex items-center gap-2">
            {introspectResult.success ? '🔬' : '❌'} Introspección Profunda del Token
          </h3>

          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium">{introspectResult.message}</p>

            {introspectResult.analysis && (
              <div className="text-sm">
                <strong>Estado:</strong>
                <span className={
                  introspectResult.analysis.sessionStatus === 'fully_valid' ? 'text-success-600' :
                  introspectResult.analysis.sessionStatus === 'revoked_by_admin' ? 'text-error-600 font-bold' :
                  introspectResult.analysis.sessionStatus === 'potentially_revoked' ? 'text-warning-600' :
                  'text-error-600'
                }>
                  {' '}
                  {introspectResult.analysis.sessionStatus === 'fully_valid' ? '✓ Completamente válida' :
                   introspectResult.analysis.sessionStatus === 'revoked_by_admin' ? '🚨 REVOCADA POR ADMINISTRADOR' :
                   introspectResult.analysis.sessionStatus === 'potentially_revoked' ? '⚠️ Posiblemente revocada' :
                   '✗ Inválida'}
                </span>

                {introspectResult.analysis.criticalSecurityIssue && (
                  <div className="mt-2 p-2 bg-error-50 border border-error-200 rounded">
                    <span className="text-error-700 font-bold text-sm">
                      🚨 ALERTA DE SEGURIDAD: Esta sesión fue revocada por un administrador pero el usuario aún aparece como autenticado localmente.
                    </span>
                  </div>
                )}
              </div>
            )}

            {introspectResult.tests?.tokenRetrieval && (
              <div className="text-sm">
                <strong>Tests de Token:</strong> {introspectResult.tests.tokenRetrieval.successful}/{introspectResult.tests.tokenRetrieval.total} exitosos
                {introspectResult.tests.consistency?.inconsistent && (
                  <span className="text-warning-600 font-medium"> (⚠️ Resultados inconsistentes)</span>
                )}
              </div>
            )}

            {introspectResult.tests?.userinfo && (
              <div className="text-sm">
                <strong>Userinfo API:</strong>
                <span className={introspectResult.tests.userinfo.success ? 'text-success-600' : 'text-error-600'}>
                  {introspectResult.tests.userinfo.success ? ' ✓ Válido' : ' ✗ Inválido'}
                </span>
                {introspectResult.tests.userinfo.status && (
                  <span className="text-muted-foreground"> (HTTP {introspectResult.tests.userinfo.status})</span>
                )}
              </div>
            )}

            {introspectResult.analysis?.recommendation && (
              <div className="text-sm font-medium text-primary">
                <strong>Recomendación:</strong> {introspectResult.analysis.recommendation}
              </div>
            )}
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-muted-foreground">Ver análisis completo</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(introspectResult, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p><strong>¿Cómo interpretar los resultados?</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>✅ Ambos válidos:</strong> Sesión activa y token válido en servidor</li>
          <li><strong>⚠️ Local válido, servidor inválido:</strong> Sesión revocada por administrador</li>
          <li><strong>❌ Ambos inválidos:</strong> No hay sesión o expiró naturalmente</li>
          <li><strong>🔬 Introspección:</strong> Análisis profundo para detectar inconsistencias</li>
        </ul>
      </div>
    </div>
  );
}
