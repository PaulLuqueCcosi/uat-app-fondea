import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import type { DocumentsVerificationStatus } from '@/lib/types/document';
import type { DocumentListResult } from '@/lib/types/document';
import type { StoreStatus } from './credit-score-store';

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
}

export interface ApplicationIntention {
  amount: number;
  termDays: number;
  installmentCount: number;
}

export type ContractStatus = 'GENERATED' | 'SIGNED' | 'EXPIRED';

export interface ContractInfo {
  contractId: string;
  applicationId: string;
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
  contractInfo: ContractInfo | null;
  contractHtml: string | null;
  pdfUrl: string | null;

  showCelebration: boolean;
  applicationIntention: ApplicationIntention | null;

  isPolling: boolean;
  _pollingInterval: ReturnType<typeof setInterval> | null;
  _pollingAttempts: number;
}

interface SolicitudActions {
  init: (applicationId: string) => void;
  reset: () => void;
  dismissCelebration: () => void;

  fetchApplication: () => Promise<ApplicationRecord | null>;
  fetchFullDetail: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchDocumentsVerification: () => Promise<void>;
  fetchContract: () => Promise<void>;

  refreshApplication: () => Promise<void>;
  refreshFullDetail: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshDocumentsVerification: () => Promise<void>;
  refreshContract: () => Promise<void>;

  setDocumentUrl: (type: keyof DocumentUrls, url: string | null) => void;
  setDocumentsVerification: (status: DocumentsVerificationStatus) => void;

  startPolling: () => void;
  stopPolling: () => void;
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
  contractInfo: null,
  contractHtml: null,
  pdfUrl: null,

  showCelebration: false,
  applicationIntention: null,

  isPolling: false,
  _pollingInterval: null,
  _pollingAttempts: 0,
};

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 10_000;
const MAX_POLL_ATTEMPTS = 30;

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
  const infoRaw = await fetchJson<any>(`/api/solicitudes/${appId}/contract`);
  if (!infoRaw) return { contractInfo: null, contractHtml: null, pdfUrl: null };

  const contractInfo: ContractInfo = {
    contractId: infoRaw.contractId,
    applicationId: infoRaw.applicationId,
    status: infoRaw.status,
    generatedAt: infoRaw.generatedAt,
    signedAt: infoRaw.signedAt,
    expiredAt: infoRaw.expiredAt,
  };

  const [html, pdfData] = await Promise.all([
    fetchText(`/api/solicitudes/${appId}/contract/html?contractId=${contractInfo.contractId}`),
    contractInfo.status === 'SIGNED'
      ? fetchJson<any>(`/api/solicitudes/${appId}/contract/pdf?contractId=${contractInfo.contractId}`)
      : null,
  ]);

  return {
    contractInfo,
    contractHtml: html,
    pdfUrl: pdfData?.pdfUrl ?? null,
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSolicitudStore = create<SolicitudStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    // ── Init / Reset ──────────────────────────────────────────────────────────

    init: (applicationId: string) => {
      const current = get().applicationId;
      if (current === applicationId) return;
      get().stopPolling();
      set({ ...INITIAL_STATE, applicationId });

      get().fetchApplication();
      get().fetchFullDetail();
      get().fetchDocuments();
      get().fetchDocumentsVerification();
      get().fetchContract();
    },

    reset: () => {
      get().stopPolling();
      set(INITIAL_STATE);
    },

    dismissCelebration: () => set({ showCelebration: false }),

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
        set({ fullDetail: detail, detailStatus: 'success' });
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
        set({ ...result, contractStatus: 'success' });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching contract:', err);
        set({ contractStatus: 'error' });
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
        set({ fullDetail: detail, detailStatus: 'success' });
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

      set({ contractStatus: 'pending', contractInfo: null, contractHtml: null, pdfUrl: null });
      try {
        const result = await loadContract(applicationId);
        set({ ...result, contractStatus: 'success' });
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

    // ── Polling ───────────────────────────────────────────────────────────────

    startPolling: () => {
      const { _pollingInterval, applicationId } = get();
      if (_pollingInterval || !applicationId) return;

      set({ isPolling: true, _pollingAttempts: 0 });

      // Cargar intención para el sidebar
      fetchJson<ApplicationIntention>(`/api/solicitudes/${applicationId}/intention`)
        .then((intention) => {
          if (intention) set({ applicationIntention: intention });
        })
        .catch(() => {});

      const poll = async () => {
        const { applicationId: appId, _pollingAttempts } = get();
        if (!appId) return;

        if (_pollingAttempts >= MAX_POLL_ATTEMPTS) {
          get().stopPolling();
          const current = get().application;
          if (current) set({ application: { ...current, status: 'FAILED' as ApplicationStatus } });
          return;
        }

        set({ _pollingAttempts: _pollingAttempts + 1 });

        try {
          const statusRaw = await fetchJson<any>(`/api/solicitudes/${appId}/status`);
          if (!statusRaw) return;

          const status = statusRaw.status as ApplicationStatus;

          if (status !== 'SUBMITTED' && status !== 'PROCESSING') {
            get().stopPolling();

            if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
              set({ showCelebration: true });
              setTimeout(() => set({ showCelebration: false }), 2500);
            }

            // Recargar todo en paralelo
            const appRaw = await fetchJson<any>(`/api/solicitudes/${appId}`);
            if (appRaw) set({ application: mapApplication(appRaw), applicationStatus: 'success' });

            const [detail, docsResult, contractResult] = await Promise.all([
              fetchJson<ApplicationFullDetail>(`/api/solicitudes/${appId}/detail`),
              loadDocumentsWithUrls(appId),
              loadContract(appId),
            ]);

            set({ fullDetail: detail, detailStatus: 'success' });
            set({ documents: docsResult.documents, documentUrls: docsResult.documentUrls, documentsStatus: 'success' });
            set({ ...contractResult, contractStatus: 'success' });
          }
        } catch (err) {
          console.error('[SolicitudStore] Polling error:', err);
        }
      };

      poll();
      const interval = setInterval(poll, POLL_INTERVAL);
      set({ _pollingInterval: interval });
    },

    stopPolling: () => {
      const interval = get()._pollingInterval;
      if (interval) clearInterval(interval);
      set({ isPolling: false, _pollingInterval: null, _pollingAttempts: 0 });
    },
  })),
);
