import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import type { DocumentsVerificationStatus } from '@/lib/types/document';
import type { DocumentListResult } from '@/lib/types/document';
import type { StoreStatus } from './credit-score-store';
import type { SimulationSnapshot } from '@/lib/types/simulation';

// ── Tipos locales (antes venían de actions, ahora son propios) ────────────────

export interface ApplicationFullDetail {
  application_id: string;
  product_id: string;
  product_name: string;
  principal: number;
  term_days: number;
  installment_count: number;
  is_first_loan: boolean;
  credit_score_used: number;
  total_fees_original: number;
  total_discounts: number;
  total_igv: number;
  total_to_pay: number;
  monthly_payment: number;
  first_due_date: string;
  schedule: Array<{
    installment_no: number;
    due_date: string;
    amount: number;
  }>;
  // Campos nuevos del endpoint detail v2
  requested_amount?: number;
  approved_amount?: number;
  was_limit_adjusted?: boolean;
  score_limit_amount?: number | null;
  limit_note?: string | null;
  simulation_snapshot?: SimulationSnapshot; // parseado desde string JSON
}

export interface ApplicationIntention {
  amount: number;
  termDays: number;
  installmentCount: number;
}

export type ContractStatus = 'GENERATED' | 'SIGNED' | 'EXPIRED' | 'FINALIZED';

export interface ContractInfo {
  contractId: string;
  applicationId: string;
  documentTypeCode: string;
  documentTypeName: string;
  visibleBeforeSignature: boolean;
  status: ContractStatus;
  generatedAt: string;
  signedAt: string | null;
  expiredAt: string | null;
}

export interface DocumentUrls {
  dniFront: string | null;
  dniBack: string | null;
  selfie: string | null;
}

// ── Mappers (snake_case del backend → camelCase del frontend) ─────────────────

function mapApplication(data: any): ApplicationRecord {
  return {
    id: data.id,
    status: data.status as ApplicationStatus,
    submittedAt: data.submitted_at ?? undefined,
    evaluatedAt: data.evaluated_at ?? undefined,
    creditScore: data.credit_score ?? undefined,
    rejectionReason: data.rejection_reason ?? undefined,
    canRetryAt: data.can_retry_at ?? undefined,
    failureCode: data.failure_code ?? undefined,
  };
}

function mapIntention(data: any): ApplicationIntention {
  return {
    amount: data.amount,
    termDays: data.term_days,
    installmentCount: data.installment_count,
  };
}

function mapDocumentList(data: any): DocumentListResult {
  return {
    applicationId: data.application_id,
    documents: (data.documents ?? []).map((d: any) => ({
      id: d.id,
      type: d.type,
      fileName: d.file_name,
      fileSizeBytes: d.file_size_bytes,
      status: d.status,
      uploadedAt: d.uploaded_at,
    })),
    allDocumentsUploaded: data.all_documents_uploaded ?? false,
  };
}

function mapDocumentsVerification(data: any): DocumentsVerificationStatus {
  const mapItem = (raw: any) => ({
    status: raw.status,
    uploaded: raw.uploaded,
    rejectionReason: raw.rejectionReason ?? null,
    failedAttempts: raw.failedAttempts ?? raw.attempts ?? 0,
    maxAttempts: raw.maxAttempts,
    remainingAttempts: raw.remainingAttempts,
  });
  return {
    id: data.id,
    applicationId: data.applicationId,
    overallStatus: data.overallStatus,
    dniFront: mapItem(data.dniFront),
    dniBack: mapItem(data.dniBack),
    selfie: mapItem(data.selfie),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// ── Fetch helpers (llaman a las API routes proxy) ─────────────────────────────

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.text();
}

// ── Helper: parsear detail con simulation_snapshot ────────────────────────────

function parseDetail(raw: any): ApplicationFullDetail {
  const detail: ApplicationFullDetail = {
    application_id: raw.application_id,
    product_id: raw.product_id,
    product_name: raw.product_name,
    principal: raw.principal,
    term_days: raw.term_days,
    installment_count: raw.installment_count,
    is_first_loan: raw.is_first_loan,
    credit_score_used: raw.credit_score_used,
    total_fees_original: raw.total_fees_original,
    total_discounts: raw.total_discounts,
    total_igv: raw.total_igv,
    total_to_pay: raw.total_to_pay,
    monthly_payment: raw.monthly_payment,
    first_due_date: raw.first_due_date,
    schedule: raw.schedule ?? [],
    requested_amount: raw.requested_amount,
    approved_amount: raw.approved_amount,
    was_limit_adjusted: raw.was_limit_adjusted,
    score_limit_amount: raw.score_limit_amount,
    limit_note: raw.limit_note,
  };

  if (raw.simulation_snapshot) {
    try {
      detail.simulation_snapshot =
        typeof raw.simulation_snapshot === 'string'
          ? JSON.parse(raw.simulation_snapshot)
          : raw.simulation_snapshot;
    } catch {
      console.warn('[SolicitudStore] Error parseando simulation_snapshot');
    }
  }

  return detail;
}

// ── State & Actions ───────────────────────────────────────────────────────────

interface SolicitudState {
  applicationId: string | null;

  applicationStatus: StoreStatus;
  application: ApplicationRecord | null;

  detailStatus: StoreStatus;
  fullDetail: ApplicationFullDetail | null;

  documentsStatus: StoreStatus;
  documents: DocumentListResult | null;
  documentUrls: DocumentUrls;

  verificationStatus: StoreStatus;
  documentsVerification: DocumentsVerificationStatus | null;

  contractStatus: StoreStatus;
  contracts: ContractInfo[];
  contractHtmlMap: Record<string, string>;
  pdfUrlMap: Record<string, string>;
  /** @deprecated Usar `contracts` — getter de retrocompatibilidad que retorna el primer contrato firmable. */
  contractInfo: ContractInfo | null;

  applicationIntention: ApplicationIntention | null;
}

interface SolicitudActions {
  init: (applicationId: string) => void;
  reset: () => void;

  fetchApplication: () => Promise<ApplicationRecord | null>;
  fetchFullDetail: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchDocumentsVerification: () => Promise<void>;
  fetchContract: () => Promise<void>;
  fetchIntention: () => Promise<void>;

  refreshApplication: () => Promise<void>;
  refreshFullDetail: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshDocumentsVerification: () => Promise<void>;
  refreshContract: () => Promise<void>;

  setDocumentUrl: (type: keyof DocumentUrls, url: string | null) => void;
  setDocumentsVerification: (status: DocumentsVerificationStatus) => void;
}

type SolicitudStore = SolicitudState & SolicitudActions;

// ── Estado inicial ────────────────────────────────────────────────────────────

const INITIAL_STATE: SolicitudState = {
  applicationId: null,

  applicationStatus: 'idle',
  application: null,

  detailStatus: 'idle',
  fullDetail: null,

  documentsStatus: 'idle',
  documents: null,
  documentUrls: { dniFront: null, dniBack: null, selfie: null },

  verificationStatus: 'idle',
  documentsVerification: null,

  contractStatus: 'idle',
  contracts: [],
  contractHtmlMap: {},
  pdfUrlMap: {},
  contractInfo: null,

  applicationIntention: null,
};

// ── Helper: cargar documentos + URLs ──────────────────────────────────────────

async function loadDocumentsWithUrls(appId: string) {
  const docsRaw = await fetchJson<any>(`/api/solicitudes/${appId}/documents`);
  if (!docsRaw) return { documents: null, documentUrls: { dniFront: null, dniBack: null, selfie: null } as DocumentUrls };

  const docs = mapDocumentList(docsRaw);

  const frontDoc = docs.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
  const backDoc = docs.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');
  const selfieDoc = docs.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');

  const [dniFrontData, dniBackData, selfieData] = await Promise.all([
    frontDoc ? fetchJson<any>(`/api/solicitudes/${appId}/documents/DNI_FRONT/url`) : null,
    backDoc ? fetchJson<any>(`/api/solicitudes/${appId}/documents/DNI_BACK/url`) : null,
    selfieDoc ? fetchJson<any>(`/api/solicitudes/${appId}/documents/SELFIE/url`) : null,
  ]);

  return {
    documents: docs,
    documentUrls: {
      dniFront: dniFrontData?.url ?? null,
      dniBack: dniBackData?.url ?? null,
      selfie: selfieData?.url ?? null,
    },
  };
}

// ── Helper: cargar contrato + HTML + PDF ──────────────────────────────────────

async function loadContract(appId: string) {
  const rawList = await fetchJson<any[]>(`/api/solicitudes/${appId}/contract`);
  if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
    return { contracts: [], contractHtmlMap: {}, pdfUrlMap: {} };
  }

  const contracts: ContractInfo[] = rawList.map((r: any) => ({
    contractId: r.contractId,
    applicationId: r.applicationId,
    documentTypeCode: r.documentTypeCode ?? '',
    documentTypeName: r.documentTypeName ?? '',
    visibleBeforeSignature: r.visibleBeforeSignature ?? true,
    status: r.status,
    generatedAt: r.generatedAt,
    signedAt: r.signedAt ?? null,
    expiredAt: r.expiredAt ?? null,
  }));

  // Cargar HTML de los documentos visibles antes de firma (los que el usuario lee)
  const visibleContracts = contracts.filter(c => c.visibleBeforeSignature);
  const htmlEntries = await Promise.all(
    visibleContracts.map(async (c) => {
      const html = await fetchText(`/api/solicitudes/${appId}/contract/html?contractId=${c.contractId}`);
      return [c.contractId, html ?? ''] as [string, string];
    })
  );
  const contractHtmlMap: Record<string, string> = Object.fromEntries(htmlEntries.filter(([, html]) => html));

  // Cargar PDF URLs solo de los que ya están firmados/finalizados
  const signedContracts = contracts.filter(c => c.status === 'SIGNED' || c.status === 'FINALIZED');
  const pdfEntries = await Promise.all(
    signedContracts.map(async (c) => {
      const data = await fetchJson<any>(`/api/solicitudes/${appId}/contract/pdf?contractId=${c.contractId}`);
      return [c.contractId, data?.pdfUrl ?? ''] as [string, string];
    })
  );
  const pdfUrlMap: Record<string, string> = Object.fromEntries(pdfEntries.filter(([, url]) => url));

  return { contracts, contractHtmlMap, pdfUrlMap };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSolicitudStore = create<SolicitudStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    // ── Init / Reset ──────────────────────────────────────────────────────────

    init: (applicationId: string) => {
      const current = get().applicationId;
      if (current === applicationId) return;
      set({ ...INITIAL_STATE, applicationId });

      get().fetchApplication();
      get().fetchFullDetail();
      get().fetchDocuments();
      get().fetchDocumentsVerification();
      get().fetchContract();
      get().fetchIntention();
    },

    reset: () => {
      set(INITIAL_STATE);
    },

    // ── Fetch Application ─────────────────────────────────────────────────────

    fetchApplication: async () => {
      const { applicationStatus, applicationId } = get();
      if (applicationStatus === 'pending' || applicationStatus === 'success') return get().application;
      if (!applicationId) return null;

      set({ applicationStatus: 'pending' });
      try {
        const raw = await fetchJson<any>(`/api/solicitudes/${applicationId}`);
        const app = raw ? mapApplication(raw) : null;
        set({ application: app, applicationStatus: 'success' });
        return app;
      } catch (err) {
        console.error('[SolicitudStore] Error fetching application:', err);
        set({ applicationStatus: 'error' });
        return null;
      }
    },

    // ── Fetch Full Detail ─────────────────────────────────────────────────────

    fetchFullDetail: async () => {
      const { detailStatus, applicationId } = get();
      if (detailStatus === 'pending' || detailStatus === 'success') return;
      if (!applicationId) return;

      set({ detailStatus: 'pending' });
      try {
        const detail = await fetchJson<ApplicationFullDetail>(`/api/solicitudes/${applicationId}/detail`);
        const parsed = detail ? parseDetail(detail) : null;
        set({ fullDetail: parsed, detailStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching full detail:', err);
        set({ detailStatus: 'error' });
      }
    },

    // ── Fetch Documents ───────────────────────────────────────────────────────

    fetchDocuments: async () => {
      const { documentsStatus, applicationId } = get();
      if (documentsStatus === 'pending' || documentsStatus === 'success') return;
      if (!applicationId) return;

      set({ documentsStatus: 'pending' });
      try {
        const { documents, documentUrls } = await loadDocumentsWithUrls(applicationId);
        set({ documents, documentUrls, documentsStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching documents:', err);
        set({ documentsStatus: 'error' });
      }
    },

    // ── Fetch Documents Verification ──────────────────────────────────────────

    fetchDocumentsVerification: async () => {
      const { verificationStatus, applicationId } = get();
      if (verificationStatus === 'pending' || verificationStatus === 'success') return;
      if (!applicationId) return;

      set({ verificationStatus: 'pending' });
      try {
        const raw = await fetchJson<any>(`/api/solicitudes/${applicationId}/documents/status`);
        const status = raw ? mapDocumentsVerification(raw) : null;
        set({ documentsVerification: status, verificationStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching verification:', err);
        set({ verificationStatus: 'error' });
      }
    },

    // ── Fetch Contract ────────────────────────────────────────────────────────

    fetchContract: async () => {
      const { contractStatus, applicationId } = get();
      if (contractStatus === 'pending' || contractStatus === 'success') return;
      if (!applicationId) return;

      set({ contractStatus: 'pending' });
      try {
        const result = await loadContract(applicationId);
        const primaryContract = result.contracts.find(c => c.visibleBeforeSignature) ?? result.contracts[0] ?? null;
        set({ ...result, contractInfo: primaryContract, contractStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching contract:', err);
        set({ contractStatus: 'error' });
      }
    },

    // ── Fetch Intention ───────────────────────────────────────────────────────

    fetchIntention: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      try {
        const raw = await fetchJson<any>(`/api/solicitudes/${applicationId}/intention`);
        if (raw) set({ applicationIntention: mapIntention(raw) });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching intention:', err);
      }
    },

    // ── Refresh (fuerza recarga) ──────────────────────────────────────────────

    refreshApplication: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ applicationStatus: 'pending', application: null });
      try {
        const raw = await fetchJson<any>(`/api/solicitudes/${applicationId}`);
        const app = raw ? mapApplication(raw) : null;
        set({ application: app, applicationStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing application:', err);
        set({ applicationStatus: 'error' });
      }
    },

    refreshFullDetail: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ detailStatus: 'pending', fullDetail: null });
      try {
        const detail = await fetchJson<ApplicationFullDetail>(`/api/solicitudes/${applicationId}/detail`);
        const parsed = detail ? parseDetail(detail) : null;
        set({ fullDetail: parsed, detailStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing full detail:', err);
        set({ detailStatus: 'error' });
      }
    },

    refreshDocuments: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ documentsStatus: 'pending' });
      try {
        const { documents, documentUrls } = await loadDocumentsWithUrls(applicationId);
        set({ documents, documentUrls, documentsStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing documents:', err);
        set({ documentsStatus: 'error' });
      }
    },

    refreshDocumentsVerification: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ verificationStatus: 'pending' });
      try {
        const raw = await fetchJson<any>(`/api/solicitudes/${applicationId}/documents/status`);
        const status = raw ? mapDocumentsVerification(raw) : null;
        set({ documentsVerification: status, verificationStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing verification:', err);
        set({ verificationStatus: 'error' });
      }
    },

    refreshContract: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ contractStatus: 'pending', contracts: [], contractHtmlMap: {}, pdfUrlMap: {}, contractInfo: null });
      try {
        const result = await loadContract(applicationId);
        const primaryContract = result.contracts.find(c => c.visibleBeforeSignature) ?? result.contracts[0] ?? null;
        set({ ...result, contractInfo: primaryContract, contractStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing contract:', err);
        set({ contractStatus: 'error' });
      }
    },

    // ── Actualizar en memoria ─────────────────────────────────────────────────

    setDocumentUrl: (type, url) => {
      set({ documentUrls: { ...get().documentUrls, [type]: url } });
    },

    setDocumentsVerification: (status) => {
      set({ documentsVerification: status, verificationStatus: 'success' });
    },

  })),
);
