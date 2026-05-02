'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, RefreshCw, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DevToolsClientProps {
  accessToken: string | null;
  tokenError: string | null;
  tokenPayload: Record<string, unknown> | null;
  claims: Record<string, unknown> | null | undefined;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-muted transition-colors"
      title="Copiar"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-success-500" />
        : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      }
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="text-xs font-mono text-foreground break-all text-right">{value}</span>
    </div>
  );
}

export function DevToolsClient({
  accessToken,
  tokenError,
  tokenPayload,
  claims,
}: DevToolsClientProps) {
  const [showToken, setShowToken] = useState(false);

  const curlCommand = accessToken
    ? `curl -H "Authorization: Bearer ${accessToken}" http://localhost:8080/api/v1/auth/me`
    : '';

  const expiresAt = tokenPayload?.exp
    ? new Date((tokenPayload.exp as number) * 1000)
    : null;
  const issuedAt = tokenPayload?.iat
    ? new Date((tokenPayload.iat as number) * 1000)
    : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dev Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Token de sesión actual para probar el backend
        </p>
      </div>

      {/* Estado del token */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Access Token</h2>
            <div className="flex items-center gap-2">
              {accessToken && !isExpired && (
                <Badge variant="success">Válido</Badge>
              )}
              {isExpired && (
                <Badge variant="destructive">Expirado</Badge>
              )}
              {tokenError && (
                <Badge variant="destructive">Error</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Renovar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-xs text-destructive">{tokenError}</p>
            </div>
          )}

          {accessToken && (
            <>
              {/* Token raw */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Bearer Token</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowToken(v => !v)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={showToken ? 'Ocultar' : 'Mostrar'}
                    >
                      {showToken
                        ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        : <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </button>
                    <CopyButton text={accessToken} />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 border p-3 font-mono text-xs break-all leading-relaxed">
                  {showToken
                    ? accessToken
                    : `${accessToken.slice(0, 40)}${'•'.repeat(20)}...`
                  }
                </div>
              </div>

              <Separator />

              {/* Payload decodificado */}
              {tokenPayload && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Payload decodificado</span>
                    <CopyButton text={JSON.stringify(tokenPayload, null, 2)} />
                  </div>
                  <div className="divide-y divide-border rounded-lg border overflow-hidden">
                    {'sub' in tokenPayload && (
                      <InfoRow label="sub (userId)" value={String(tokenPayload.sub)} />
                    )}
                    {'aud' in tokenPayload && (
                      <InfoRow
                        label="aud (audience)"
                        value={Array.isArray(tokenPayload.aud)
                          ? (tokenPayload.aud as string[]).join(', ')
                          : String(tokenPayload.aud)}
                      />
                    )}
                    {'iss' in tokenPayload && (
                      <InfoRow label="iss (issuer)" value={String(tokenPayload.iss)} />
                    )}
                    {'scope' in tokenPayload && (
                      <InfoRow label="scope" value={String(tokenPayload.scope)} />
                    )}
                    {issuedAt && (
                      <InfoRow label="iat (emitido)" value={issuedAt.toLocaleString()} />
                    )}
                    {expiresAt && (
                      <InfoRow
                        label="exp (expira)"
                        value={`${expiresAt.toLocaleString()}${isExpired ? ' ⚠️ EXPIRADO' : ''}`}
                      />
                    )}
                    {'client_id' in tokenPayload && (
                      <InfoRow label="client_id" value={String(tokenPayload.client_id)} />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Comando curl listo para copiar */}
      {accessToken && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Probar con curl</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2">
              <div className="flex-1 rounded-lg bg-neutral-900 text-neutral-100 p-3 font-mono text-xs leading-relaxed break-all">
                {curlCommand}
              </div>
              <CopyButton text={curlCommand} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cambia la URL por cualquier endpoint de tu backend.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Claims de sesión */}
      {claims && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-sm font-semibold">Claims de sesión (Logto)</h2>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {Object.entries(claims).map(([key, value]) => (
                <InfoRow
                  key={key}
                  label={key}
                  value={typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value ?? '—')}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
