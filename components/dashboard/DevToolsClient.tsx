'use client';

import { useState, useEffect } from 'react';
import {
  Copy, Check, Eye, EyeOff, RefreshCw, Terminal,
  ShieldCheck, ShieldOff, Clock, User, Key, Settings, Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevToolsClientProps {
  isAuthenticated: boolean;
  claims: Record<string, unknown> | null;
  userInfo: Record<string, unknown> | null;
  accessToken: string | null;
  tokenError: string | null;
  tokenPayload: Record<string, unknown> | null;
  accessTokenMap: Record<string, unknown> | null;
  organizationTokenMap: Record<string, unknown> | null;
  activeConfig: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded hover:bg-muted transition-colors shrink-0"
      title="Copiar"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-500" />
        : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0 w-40">{label}</span>
      <span className={`text-xs break-all text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}

function JsonBlock({ data, copyable = true }: { data: unknown; copyable?: boolean }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="relative">
      <pre className="rounded-lg bg-neutral-900 text-neutral-100 p-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
        {text}
      </pre>
      {copyable && (
        <div className="absolute top-2 right-2">
          <CopyButton text={text} />
        </div>
      )}
    </div>
  );
}

function ExpiryCountdown({ exp }: { exp: number }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = exp * 1000 - Date.now();
      if (diff <= 0) { setRemaining('EXPIRADO'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [exp]);

  const isExpired = exp * 1000 < Date.now();
  return (
    <span className={`font-mono text-xs ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
      {remaining}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DevToolsClient({
  isAuthenticated,
  claims,
  userInfo,
  accessToken,
  tokenError,
  tokenPayload,
  accessTokenMap,
  organizationTokenMap,
  activeConfig,
}: DevToolsClientProps) {
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'token' | 'claims' | 'userinfo' | 'tokenmap' | 'orgs' | 'config' | 'curl'
  >('token');

  const expiresAt = tokenPayload?.exp ? new Date((tokenPayload.exp as number) * 1000) : null;
  const issuedAt  = tokenPayload?.iat ? new Date((tokenPayload.iat as number) * 1000) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;

  const curlCommand = accessToken
    ? `curl -H "Authorization: Bearer ${accessToken}" \\\n  ${activeConfig.apiResource ?? 'http://localhost:8080'}/api/v1/auth/me`
    : '';

  const tabs = [
    { id: 'token',    label: 'Access Token' },
    { id: 'claims',   label: 'ID Claims' },
    { id: 'userinfo', label: 'User Info' },
    { id: 'tokenmap', label: 'Token Map' },
    { id: 'orgs',     label: 'Orgs' },
    { id: 'config',   label: 'Config' },
    { id: 'curl',     label: 'cURL' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dev Tools — Logto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Todo lo que expone el SDK en la sesión actual
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated
            ? <Badge className="gap-1.5 bg-green-100 text-green-800 border-green-200">
                <ShieldCheck className="w-3 h-3" /> Autenticado
              </Badge>
            : <Badge variant="destructive" className="gap-1.5">
                <ShieldOff className="w-3 h-3" /> No autenticado
              </Badge>
          }
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            Refrescar
          </Button>
        </div>
      </div>

      {/* Resumen rápido */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Usuario</p>
              <p className="text-sm font-medium truncate">
                {(claims?.name as string) || (claims?.email as string) || (claims?.sub as string) || '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{(claims?.email as string) || '—'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Token expira en</p>
              <p className="text-sm font-medium">
                {tokenPayload?.exp
                  ? <ExpiryCountdown exp={tokenPayload.exp as number} />
                  : '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Token Map entries</p>
              <p className="text-sm font-medium">
                {accessTokenMap ? Object.keys(accessTokenMap).length : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Access Token ── */}
      {activeTab === 'token' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={Key} title="Access Token" />

            {tokenError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700 font-mono">{tokenError}</p>
              </div>
            )}

            {accessToken && (
              <>
                {/* Estado */}
                <div className="flex items-center gap-2">
                  {!isExpired
                    ? <Badge className="bg-green-100 text-green-800 border-green-200">Válido</Badge>
                    : <Badge variant="destructive">Expirado</Badge>
                  }
                  {expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      Expira: {expiresAt.toLocaleString()}
                    </span>
                  )}
                  {issuedAt && (
                    <span className="text-xs text-muted-foreground">
                      Emitido: {issuedAt.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Token raw */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Bearer Token</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowToken(v => !v)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        {showToken
                          ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <CopyButton text={accessToken} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 border p-3 font-mono text-xs break-all leading-relaxed">
                    {showToken ? accessToken : `${accessToken.slice(0, 50)}${'•'.repeat(20)}...`}
                  </div>
                </div>

                <Separator />

                {/* Payload decodificado — tabla */}
                {tokenPayload && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Payload decodificado</span>
                      <CopyButton text={JSON.stringify(tokenPayload, null, 2)} />
                    </div>
                    <div className="divide-y divide-border rounded-lg border overflow-hidden">
                      {Object.entries(tokenPayload).map(([key, value]) => (
                        <Row
                          key={key}
                          label={key}
                          value={
                            key === 'exp' || key === 'iat' || key === 'nbf'
                              ? `${new Date((value as number) * 1000).toLocaleString()} (${value})`
                              : Array.isArray(value)
                                ? value.join(', ')
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value ?? '—')
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: ID Claims ── */}
      {activeTab === 'claims' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={User} title="ID Token Claims" />
            <p className="text-xs text-muted-foreground">
              Claims del ID token — datos del usuario almacenados en la cookie local.
              Provienen de <code className="bg-muted px-1 rounded">getLogtoContext()</code>.
            </p>
            {claims ? (
              <>
                <div className="divide-y divide-border rounded-lg border overflow-hidden">
                  {Object.entries(claims).map(([key, value]) => (
                    <Row
                      key={key}
                      label={key}
                      value={
                        key === 'exp' || key === 'iat' || key === 'auth_time'
                          ? `${new Date((value as number) * 1000).toLocaleString()} (${value})`
                          : Array.isArray(value)
                            ? value.join(', ')
                            : typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value ?? '—')
                      }
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <CopyButton text={JSON.stringify(claims, null, 2)} />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sin claims disponibles.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: User Info ── */}
      {activeTab === 'userinfo' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={User} title="User Info (endpoint /oidc/me)" />
            <p className="text-xs text-muted-foreground">
              Datos obtenidos directamente del endpoint <code className="bg-muted px-1 rounded">/oidc/me</code> de Logto.
              Más completos que los claims del ID token — incluye <code className="bg-muted px-1 rounded">custom_data</code>, identidades, etc.
              Requiere <code className="bg-muted px-1 rounded">fetchUserInfo: true</code>.
            </p>
            {userInfo ? (
              <JsonBlock data={userInfo} />
            ) : (
              <div className="rounded-lg bg-muted/50 border p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No hay userInfo disponible. Verificar que <code className="bg-muted px-1 rounded">fetchUserInfo: true</code> esté configurado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Token Map ── */}
      {activeTab === 'tokenmap' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={Database} title="Access Token Map" />
            <p className="text-xs text-muted-foreground">
              Mapa de todos los access tokens por resource. Cada entrada tiene el token JWT,
              los scopes y la fecha de expiración.
            </p>
            {accessTokenMap && Object.keys(accessTokenMap).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(accessTokenMap).map(([resource, entry]) => {
                  const e = entry as any;
                  return (
                    <div key={resource} className="rounded-lg border overflow-hidden">
                      <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-mono font-medium">{resource || '(default)'}</span>
                        {e.expiresAt && (
                          <span className="text-xs text-muted-foreground">
                            Expira: {new Date(e.expiresAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-border">
                        {e.scope && <Row label="scope" value={e.scope} />}
                        {e.expiresAt && (
                          <Row label="expiresAt" value={new Date(e.expiresAt).toLocaleString()} />
                        )}
                        {e.token && (
                          <div className="px-3 py-2">
                            <p className="text-xs text-muted-foreground mb-1">token</p>
                            <p className="text-xs font-mono break-all text-muted-foreground">
                              {e.token.slice(0, 60)}...
                            </p>
                          </div>
                        )}
                      </div>
                      {e.payload && (
                        <div className="px-3 pb-3">
                          <p className="text-xs text-muted-foreground mb-1.5 mt-2">Payload decodificado</p>
                          <JsonBlock data={e.payload} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 border p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No hay tokens en el mapa. Se populan cuando se llama a{' '}
                  <code className="bg-muted px-1 rounded">getAccessToken()</code> o{' '}
                  <code className="bg-muted px-1 rounded">getAccessTokenRSC()</code>.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Organizations ── */}
      {activeTab === 'orgs' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={Database} title="Organization Token Map" />
            <p className="text-xs text-muted-foreground">
              Tokens de organización. Solo disponibles si el scope{' '}
              <code className="bg-muted px-1 rounded">urn:logto:scope:organizations</code> está configurado.
            </p>
            {organizationTokenMap && Object.keys(organizationTokenMap).length > 0 ? (
              <JsonBlock data={organizationTokenMap} />
            ) : (
              <div className="rounded-lg bg-muted/50 border p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No hay organization tokens. Este proyecto no usa multi-tenancy por ahora.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Config ── */}
      {activeTab === 'config' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={Settings} title="Configuración activa" />
            <p className="text-xs text-muted-foreground">
              Variables de entorno y config del SDK actualmente en uso. Secrets omitidos.
            </p>
            <div className="divide-y divide-border rounded-lg border overflow-hidden">
              {Object.entries(activeConfig).map(([key, value]) => (
                <Row
                  key={key}
                  label={key}
                  value={Array.isArray(value) ? value.join(', ') : String(value ?? '—')}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: cURL ── */}
      {activeTab === 'curl' && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <SectionTitle icon={Terminal} title="Comandos cURL" />
            <p className="text-xs text-muted-foreground">
              Comandos listos para probar el backend con el token actual.
            </p>

            {accessToken ? (
              <div className="space-y-4">
                {/* Auth me */}
                <div>
                  <p className="text-xs font-medium mb-1.5">GET /api/v1/auth/me</p>
                  <div className="flex items-start gap-2">
                    <pre className="flex-1 rounded-lg bg-neutral-900 text-neutral-100 p-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                      {`curl -H "Authorization: Bearer ${accessToken}" \\\n  ${activeConfig.apiResource ?? 'http://localhost:8080'}/api/v1/auth/me`}
                    </pre>
                    <CopyButton text={`curl -H "Authorization: Bearer ${accessToken}" \\\n  ${activeConfig.apiResource ?? 'http://localhost:8080'}/api/v1/auth/me`} />
                  </div>
                </div>

                {/* Token completo para pegar en Postman/Insomnia */}
                <div>
                  <p className="text-xs font-medium mb-1.5">Header para Postman / Insomnia</p>
                  <div className="flex items-start gap-2">
                    <pre className="flex-1 rounded-lg bg-neutral-900 text-neutral-100 p-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                      {`Authorization: Bearer ${accessToken}`}
                    </pre>
                    <CopyButton text={`Bearer ${accessToken}`} />
                  </div>
                </div>

                {/* Solo el token */}
                <div>
                  <p className="text-xs font-medium mb-1.5">Solo el token (para jwt.io)</p>
                  <div className="flex items-start gap-2">
                    <pre className="flex-1 rounded-lg bg-neutral-900 text-neutral-100 p-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                      {accessToken}
                    </pre>
                    <CopyButton text={accessToken} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pegalo en{' '}
                    <a href="https://jwt.io" target="_blank" rel="noopener noreferrer"
                      className="text-primary underline">
                      jwt.io
                    </a>{' '}
                    para ver el payload completo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 border p-4 text-center">
                <p className="text-xs text-muted-foreground">No hay access token disponible.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        Datos capturados: {new Date().toLocaleString()} — Esta página no usa cache.
      </p>
    </div>
  );
}
