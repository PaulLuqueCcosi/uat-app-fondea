import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import type { DocumentsVerificationStatus } from '@/lib/types/document';
import type { ApplicationFullDetail, ApplicationIntention } from '@/app/actions/application.actions';
import type { DocumentListResult } from '@/lib/types/document';
import type { ContractInfo } from '@/app/actions/contract.actions';
import {
  getApplicationDetailAction,
  getApplicationFullDetailAction,
  getApplicationStatusAction,
  getApplicationIntentionAction,
} from '@/app/actions/application.actions';
import {
  listDocumentsAction,
  getDocumentUrlAction,
  getDocumentsVerificationStatusAction,
} from '@/app/actions/document.actions';
import {
  getContractInfoAction,
  getContractHtmlAction,
  getContractPdfUrlAction,
} from '@/app/actions/contract.actions';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DocumentUrls {
  dniFront: string | null;
  dniBack: string | null;
  selfie: string | null;
}

interface SolicitudState {
  // ── ID ──
  applicationId: string | null;

  // ── Application ──
  applicationLoading: boolean;
  application: ApplicationRecord | null;
  applicationNotFound: boolean;

  // ── Full Detail ──
  detailLoading: boolean;
  fullDetail: ApplicationFullDetail | null;
  detailNotFound: boolean;

  // ── Documents ──
  documentsLoading: boolean;
  documents: DocumentListResult | null;
  documentUrls: DocumentUrls;

  // ── Documents Verification ──
  verificationLoading: boolean;
  documentsVerification: DocumentsVerificationStatus | null;

  // ── Contract ──
  contractLoading: boolean;
  contractInfo: ContractInfo | null;
  contractHtml: string | null;
  pdfUrl: string | null;

  // ── UI ──
  showCelebration: boolean;

  // ── Intención (para sidebar durante polling) ──
  applicationIntention: ApplicationIntention | null;

  // ── Polling ──
  isPolling: boolean;
  _pollingInterval: ReturnType<typeof setInterval> | null;
  _pollingAttempts: number;
}

interface SolicitudActions {
  // ── Lifecycle ──
  init: (applicationId: string) => void;
  reset: () => void;

  // ── UI ──
  dismissCelebration: () => void;

  // ── Fetch (no recarga si ya tiene datos) ──
  fetchApplication: () => Promise<ApplicationRecord | null>;
  fetchFullDetail: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchDocumentsVerification: () => Promise<void>;
  fetchContract: () => Promise<void>;

  // ── Refresh (fuerza recarga) ──
  refreshApplication: () => Promise<void>;
  refreshFullDetail: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshDocumentsVerification: () => Promise<void>;
  refreshContract: () => Promise<void>;

  // ── Actualizar en memoria ──
  setDocumentUrl: (type: keyof DocumentUrls, url: string | null) => void;
  setDocumentsVerification: (status: DocumentsVerificationStatus) => void;

  // ── Polling ──
  startPolling: () => void;
  stopPolling: () => void;
}

type SolicitudStore = SolicitudState & SolicitudActions;

// ── Estado inicial ────────────────────────────────────────────────────────────

const INITIAL_STATE: SolicitudState = {
  applicationId: null,

  applicationLoading: false,
  application: null,
  applicationNotFound: false,

  detailLoading: false,
  fullDetail: null,
  detailNotFound: false,

  documentsLoading: false,
  documents: null,
  documentUrls: { dniFront: null, dniBack: null, selfie: null },

  verificationLoading: false,
  documentsVerification: null,

  contractLoading: false,
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

      // Disparar fetches
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
      const { application, applicationId, applicationLoading } = get();
      if (application || !applicationId || applicationLoading) return application;

      set({ applicationLoading: true });
      try {
        const app = await getApplicationDetailAction(applicationId);
        if (!app) {
          set({ applicationLoading: false, applicationNotFound: true });
          return null;
        }
        set({ application: app, applicationLoading: false });
        return app;
      } catch (err) {
        console.error('[SolicitudStore] Error fetching application:', err);
        set({ applicationLoading: false });
        return null;
      }
    },

    // ── Fetch Full Detail ─────────────────────────────────────────────────────

    fetchFullDetail: async () => {
      const { fullDetail, applicationId, detailLoading } = get();
      if (fullDetail || !applicationId || detailLoading) return;

      set({ detailLoading: true });
      try {
        const detail = await getApplicationFullDetailAction(applicationId);
        set({
          fullDetail: detail,
          detailLoading: false,
          detailNotFound: !detail,
        });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching full detail:', err);
        set({ detailLoading: false });
      }
    },

    // ── Fetch Documents ───────────────────────────────────────────────────────

    fetchDocuments: async () => {
      const { documents, applicationId, documentsLoading } = get();
      if (documents || !applicationId || documentsLoading) return;

      set({ documentsLoading: true });
      try {
        const docs = await listDocumentsAction(applicationId);
        if (!docs) {
          set({ documents: null, documentsLoading: false });
          return;
        }

        set({ documents: docs });

        const frontDoc = docs.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
        const backDoc = docs.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');
        const selfieDoc = docs.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');

        const [dniFront, dniBack, selfie] = await Promise.all([
          frontDoc ? getDocumentUrlAction(applicationId, 'DNI_FRONT') : null,
          backDoc ? getDocumentUrlAction(applicationId, 'DNI_BACK') : null,
          selfieDoc ? getDocumentUrlAction(applicationId, 'SELFIE') : null,
        ]);

        set({ documentUrls: { dniFront, dniBack, selfie }, documentsLoading: false });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching documents:', err);
        set({ documentsLoading: false });
      }
    },

    // ── Fetch Documents Verification ──────────────────────────────────────────

    fetchDocumentsVerification: async () => {
      const { documentsVerification, applicationId, verificationLoading } = get();
      if (documentsVerification || !applicationId || verificationLoading) return;

      set({ verificationLoading: true });
      try {
        const status = await getDocumentsVerificationStatusAction(applicationId);
        set({ documentsVerification: status, verificationLoading: false });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching verification:', err);
        set({ verificationLoading: false });
      }
    },

    // ── Fetch Contract ────────────────────────────────────────────────────────

    fetchContract: async () => {
      const { contractInfo, applicationId, contractLoading } = get();
      if (contractInfo || !applicationId || contractLoading) return;

      set({ contractLoading: true });
      try {
        const info = await getContractInfoAction(applicationId);
        if (!info) {
          set({ contractLoading: false });
          return;
        }

        set({ contractInfo: info });

        const [html, pdf] = await Promise.all([
          getContractHtmlAction(info.contractId),
          info.status === 'SIGNED' ? getContractPdfUrlAction(info.contractId) : null,
        ]);

        set({ contractHtml: html, pdfUrl: pdf, contractLoading: false });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching contract:', err);
        set({ contractLoading: false });
      }
    },

    // ── Refresh (fuerza recarga) ──────────────────────────────────────────────

    refreshApplication: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ applicationLoading: true, application: null, applicationNotFound: false });
      try {
        const app = await getApplicationDetailAction(applicationId);
        set({
          application: app,
          applicationLoading: false,
          applicationNotFound: !app,
        });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing application:', err);
        set({ applicationLoading: false });
      }
    },

    refreshFullDetail: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ detailLoading: true, fullDetail: null, detailNotFound: false });
      try {
        const detail = await getApplicationFullDetailAction(applicationId);
        set({
          fullDetail: detail,
          detailLoading: false,
          detailNotFound: !detail,
        });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing full detail:', err);
        set({ detailLoading: false });
      }
    },

    refreshDocuments: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ documentsLoading: true });
      try {
        const docs = await listDocumentsAction(applicationId);
        set({ documents: docs });

        if (docs) {
          const frontDoc = docs.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
          const backDoc = docs.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');
          const selfieDoc = docs.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');

          const [dniFront, dniBack, selfie] = await Promise.all([
            frontDoc ? getDocumentUrlAction(applicationId, 'DNI_FRONT') : null,
            backDoc ? getDocumentUrlAction(applicationId, 'DNI_BACK') : null,
            selfieDoc ? getDocumentUrlAction(applicationId, 'SELFIE') : null,
          ]);
          set({ documentUrls: { dniFront, dniBack, selfie } });
        }
      } finally {
        set({ documentsLoading: false });
      }
    },

    refreshDocumentsVerification: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ verificationLoading: true });
      try {
        const status = await getDocumentsVerificationStatusAction(applicationId);
        set({ documentsVerification: status, verificationLoading: false });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing verification:', err);
        set({ verificationLoading: false });
      }
    },

    refreshContract: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ contractLoading: true, contractInfo: null, contractHtml: null, pdfUrl: null });
      try {
        const info = await getContractInfoAction(applicationId);
        if (!info) {
          set({ contractLoading: false });
          return;
        }

        set({ contractInfo: info });
        const [html, pdf] = await Promise.all([
          getContractHtmlAction(info.contractId),
          info.status === 'SIGNED' ? getContractPdfUrlAction(info.contractId) : null,
        ]);
        set({ contractHtml: html, pdfUrl: pdf, contractLoading: false });
      } catch (err) {
        console.error('[SolicitudStore] Error refreshing contract:', err);
        set({ contractLoading: false });
      }
    },

    // ── Actualizar en memoria ─────────────────────────────────────────────────

    setDocumentUrl: (type, url) => {
      set({ documentUrls: { ...get().documentUrls, [type]: url } });
    },

    setDocumentsVerification: (status) => {
      set({ documentsVerification: status, verificationLoading: false });
    },

    // ── Polling ───────────────────────────────────────────────────────────────

    startPolling: () => {
      const { _pollingInterval, applicationId } = get();
      if (_pollingInterval || !applicationId) return;

      set({ isPolling: true, _pollingAttempts: 0 });

      // Cargar intención para sidebar
      getApplicationIntentionAction(applicationId)
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
          const status = await getApplicationStatusAction(appId);
          if (!status) return;

          if (status !== 'SUBMITTED' && status !== 'PROCESSING') {
            get().stopPolling();

            // Celebración
            if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
              set({ showCelebration: true });
              setTimeout(() => set({ showCelebration: false }), 2500);
            }

            // Recargar todo con datos frescos
            const app = await getApplicationDetailAction(appId);
            if (app) set({ application: app, applicationLoading: false });

            const [detailRes, docsRes, contractRes] = await Promise.all([
              getApplicationFullDetailAction(appId),
              listDocumentsAction(appId),
              getContractInfoAction(appId),
            ]);

            set({ fullDetail: detailRes, detailLoading: false, detailNotFound: !detailRes });
            set({ documents: docsRes, documentsLoading: false });

            if (docsRes) {
              const frontDoc = docsRes.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
              const backDoc = docsRes.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');
              const selfieDoc = docsRes.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');

              const [dniFront, dniBack, selfie] = await Promise.all([
                frontDoc ? getDocumentUrlAction(appId, 'DNI_FRONT') : null,
                backDoc ? getDocumentUrlAction(appId, 'DNI_BACK') : null,
                selfieDoc ? getDocumentUrlAction(appId, 'SELFIE') : null,
              ]);
              set({ documentUrls: { dniFront, dniBack, selfie } });
            }

            if (contractRes) {
              set({ contractInfo: contractRes });
              const [html, pdf] = await Promise.all([
                getContractHtmlAction(contractRes.contractId),
                contractRes.status === 'SIGNED' ? getContractPdfUrlAction(contractRes.contractId) : null,
              ]);
              set({ contractHtml: html, pdfUrl: pdf, contractLoading: false });
            }
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
