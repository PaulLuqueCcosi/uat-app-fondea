'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle, CheckCircle2, ImageIcon, Loader2, Pencil, Upload, QrCode, History,
} from 'lucide-react';
import { ButtonContent } from '@/components/shared/ButtonContent';
import {
  getAdminActiveDepositAccountAction,
  getDepositAccountHistoryAction,
  createDepositAccountAction,
  uploadDepositAccountQrAction,
} from '@/app/actions/deposit-account.actions';
import type { DepositAccountConfig } from '@/modules/deposit-account';
import { formatBackendDateTime } from '@/modules/shared/backend-date';

// El backend acepta hasta 5MB (depositos.qr.max-file-size-mb) — validamos acá también
// para no hacer viajar el archivo y recibir un 400 previsible.
const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface Draft {
  bankName: string;
  accountNumber: string;
  accountType: string;
  cci: string;
  holderName: string;
  description: string;
}

const EMPTY_DRAFT: Draft = {
  bankName: '',
  accountNumber: '',
  accountType: '',
  cci: '',
  holderName: '',
  description: '',
};

function draftFrom(config: DepositAccountConfig): Draft {
  return {
    bankName: config.bankName,
    accountNumber: config.accountNumber,
    accountType: config.accountType ?? '',
    cci: config.cci ?? '',
    holderName: config.holderName,
    description: config.description ?? '',
  };
}

/**
 * Configuración de la cuenta a la que los clientes depositan.
 *
 * <p>Guardar NO edita la cuenta vigente: crea una versión nueva y desactiva la anterior
 * (mismo modelo que la config de mora). El historial de abajo es la evidencia de a qué
 * cuenta se le pidió depositar a un cliente en cada momento.
 */
export function DepositAccountPage() {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<DepositAccountConfig | null | undefined>(undefined);
  const [history, setHistory] = useState<DepositAccountConfig[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [activeRes, historyRes] = await Promise.all([
      getAdminActiveDepositAccountAction(),
      getDepositAccountHistoryAction(),
    ]);

    if (activeRes.ok) {
      setActive(activeRes.data);
    } else {
      setActive(null);
      setMessage({ type: 'error', text: activeRes.error.message });
    }

    if (historyRes.ok) setHistory(historyRes.data);
  }

  function openEdit() {
    setDraft(active ? draftFrom(active) : EMPTY_DRAFT);
    setMessage(null);
    setEditing(true);
  }

  function handleSave() {
    setMessage(null);

    startTransition(async () => {
      const result = await createDepositAccountAction({
        bankName: draft.bankName.trim(),
        accountNumber: draft.accountNumber.trim(),
        accountType: draft.accountType.trim() || null,
        cci: draft.cci.trim() || null,
        holderName: draft.holderName.trim(),
        description: draft.description.trim() || null,
        // Conserva el QR de la versión vigente para que corregir un dato de texto no
        // obligue a volver a subir la misma imagen.
        keepCurrentQrImage: true,
      });

      if (result.ok) {
        setEditing(false);
        setMessage({ type: 'success', text: 'Cuenta actualizada. Es la que verán los clientes al pagar.' });
        await load();
      } else {
        setMessage({ type: 'error', text: result.error.message });
      }
    });
  }

  async function handleImageSelected(file: File) {
    setImageError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Solo se aceptan JPEG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`El archivo excede el máximo de ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    if (!active) {
      setImageError('Primero guarda los datos de la cuenta y luego sube el QR.');
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadDepositAccountQrAction(active.id, formData);
    setIsUploadingImage(false);

    if (result.ok) {
      setActive(result.data);
      await load();
    } else {
      setImageError(result.error.message);
    }
  }

  if (active === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg border p-3 flex items-start gap-2 ${
            message.type === 'error'
              ? 'border-error-100 bg-error-50'
              : 'border-success-100 bg-success-50'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-error-700 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-success-700 shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === 'error' ? 'text-error-700' : 'text-success-700'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Aviso de bloqueo: sin cuenta el cliente no puede depositar. */}
      {!active && !editing && (
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-4 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-warning-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-900">No hay una cuenta configurada</p>
            <p className="text-sm text-warning-700 mt-0.5">
              Los clientes no pueden ver a dónde depositar. Configura la cuenta para desbloquear
              el pago de cuotas.
            </p>
          </div>
        </div>
      )}

      {/* ── Cuenta vigente ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Cuenta vigente</CardTitle>
              <CardDescription>
                Es la que ve el cliente al declarar el pago de una cuota.
              </CardDescription>
            </div>
            {!editing && (
              <Button size="sm" variant={active ? 'outline' : 'default'} onClick={openEdit}>
                <ButtonContent
                  icon={Pencil}
                  label={active ? 'Editar' : 'Configurar cuenta'}
                  iconClassName="h-3.5 w-3.5"
                />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Banco" required>
                  <Input
                    value={draft.bankName}
                    onChange={(e) => setDraft({ ...draft, bankName: e.target.value })}
                    placeholder="Ej: BCP"
                    className="h-9"
                  />
                </Field>
                <Field label="Titular de la cuenta" required>
                  <Input
                    value={draft.holderName}
                    onChange={(e) => setDraft({ ...draft, holderName: e.target.value })}
                    placeholder="Ej: Fondea SAC"
                    className="h-9"
                  />
                </Field>
                <Field label="Número de cuenta" required>
                  <Input
                    value={draft.accountNumber}
                    onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })}
                    placeholder="Ej: 191-1234567-0-11"
                    className="h-9 font-mono"
                  />
                </Field>
                <Field label="CCI (interbancario)" hint="Opcional — para transferir desde otro banco">
                  <Input
                    value={draft.cci}
                    onChange={(e) => setDraft({ ...draft, cci: e.target.value })}
                    placeholder="Ej: 00219100123456701159"
                    className="h-9 font-mono"
                  />
                </Field>
                <Field label="Tipo de cuenta" hint="Opcional">
                  <Input
                    value={draft.accountType}
                    onChange={(e) => setDraft({ ...draft, accountType: e.target.value })}
                    placeholder="Ej: Ahorros soles"
                    className="h-9"
                  />
                </Field>
              </div>

              <Field label="Instrucciones para el cliente" hint="Opcional — se muestra junto a la cuenta">
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Ej: Coloca tu DNI en el detalle de la transferencia."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </Field>

              <p className="text-xs text-muted-foreground">
                Guardar crea una versión nueva y desactiva la anterior. El QR actual se
                mantiene — para cambiarlo, súbelo después de guardar.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={
                    isPending ||
                    !draft.bankName.trim() ||
                    !draft.accountNumber.trim() ||
                    !draft.holderName.trim()
                  }
                >
                  <ButtonContent
                    loading={isPending}
                    icon={CheckCircle2}
                    label="Guardar"
                    loadingLabel="Guardando..."
                  />
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setMessage(null); }} disabled={isPending}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : active ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Banco" value={active.bankName} />
                <ReadOnlyField label="Titular" value={active.holderName} />
                <ReadOnlyField label="Número de cuenta" value={active.accountNumber} mono />
                <ReadOnlyField label="CCI" value={active.cci ?? '—'} mono />
                <ReadOnlyField label="Tipo de cuenta" value={active.accountType ?? '—'} />
                <ReadOnlyField label="Configurada el" value={formatBackendDateTime(active.createdAt)} />
              </div>

              {active.description && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Instrucciones para el cliente</p>
                  <p className="text-sm mt-0.5">{active.description}</p>
                </div>
              )}

              <Separator />

              {/* ── QR ── */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Código QR</p>
                </div>
                <div className="flex items-start gap-4">
                  {active.qrImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={active.qrImageUrl}
                      alt="QR de la cuenta de depósito"
                      className="w-28 h-28 rounded-md object-contain border bg-white"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-md border border-dashed flex items-center justify-center text-muted-foreground shrink-0">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelected(file);
                        e.target.value = '';
                      }}
                    />
                    {/* Este botón era el que reventaba: al subir la imagen cambiaban a la
                        vez el icono (Upload → Loader2) y el texto suelto de al lado
                        ("Subir QR" → "Reemplazar QR"), y React fallaba al reubicar el nodo
                        de texto. Ver .kiro/skills/button-spinner-hydration.md */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ButtonContent
                        loading={isUploadingImage}
                        icon={Upload}
                        label={active.qrImageUrl ? 'Reemplazar QR' : 'Subir QR'}
                        loadingLabel="Subiendo..."
                        iconClassName="h-3.5 w-3.5"
                      />
                    </Button>
                    <p className="text-[10px] text-muted-foreground">
                      JPEG, PNG o WEBP — máx. {MAX_IMAGE_SIZE_MB}MB.
                    </p>
                    {imageError && <p className="text-[10px] text-error-700">{imageError}</p>}
                    {!active.qrImageUrl && (
                      <p className="text-[10px] text-muted-foreground">
                        Sin QR el cliente solo verá los datos de la cuenta.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin cuenta configurada. Usa &quot;Configurar cuenta&quot; para crear la primera.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Historial ── */}
      {history.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Versiones anteriores
            </CardTitle>
            <CardDescription className="text-xs">
              Cada cambio guarda una versión. Sirve para saber a qué cuenta se le pidió
              depositar a un cliente en una fecha dada.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Banco</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cuenta</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Titular</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id} className={`border-b last:border-0 ${!c.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-2.5">{c.bankName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{c.accountNumber}</td>
                      <td className="px-4 py-2.5">{c.holderName}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {formatBackendDateTime(c.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={c.isActive ? 'success' : 'secondary'} className="text-[10px]">
                          {c.isActive ? 'Vigente' : 'Anterior'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-error-600 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
