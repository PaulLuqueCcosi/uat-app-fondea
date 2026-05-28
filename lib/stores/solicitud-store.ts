import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import type { DocumentsVerificationStatus } from '@/lib/types/document';
import type { ApplicationFullDetail, ApplicationIntention } from '@/app/actions/application.actions';
import type { DocumentListResult } from '@/lib/types/document';
import type { ContractInfo } from '@/app/actions/contract.actions';
import type { StoreStatus } from './credit-score-store';
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
  applicationStatus: StoreStatus;
  application: ApplicationRecord | null;

  // ── Full Detail ──
  detailStatus: StoreStatus;
  fullDetail: ApplicationFullDetail | null;

  // ── Documents ──
  documentsStatus: StoreStatus;
  documents: DocumentListResult | null;
  documentUrls: DocumentUrls;

  // ── Documents Verification ──
  verificationStatus: StoreStatus;
  documentsVerification: DocumentsVerificationStatus | null;

  // ── Contract ──
  contractStatus: StoreStatus;
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
      const { applicationStatus, applicationId } = get();
      if (applicationStatus === 'pending' || applicationStatus === 'success') return get().application;
      if (!applicationId) return null;

      set({ applicationStatus: 'pending' });
      try {
        const app = await getApplicationDetailAction(applicationId);
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
        const detail = await getApplicationFullDetailAction(applicationId);
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
        const docs = await listDocumentsAction(applicationId);
        if (!docs) {
          set({ documents: null, documentsStatus: 'success' });
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

        set({ documentUrls: { dniFront, dniBack, selfie }, documentsStatus: 'success' });
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
        const status = await getDocumentsVerificationStatusAction(applicationId);
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
        const info = await getContractInfoAction(applicationId);
        if (!info) {
          set({ contractStatus: 'success' });
          return;
        }

        set({ contractInfo: info });

        const [html, pdf] = await Promise.all([
          getContractHtmlAction(info.contractId),
          info.status === 'SIGNED' ? getContractPdfUrlAction(info.contractId) : null,
        ]);

        set({ contractHtml: html, pdfUrl: pdf, contractStatus: 'success' });
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
        const app = await getApplicationDetailAction(applicationId);
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
        const detail = await getApplicationFullDetailAction(applicationId);
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
        set({ documentsStatus: 'success' });
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
        const status = await getDocumentsVerificationStatusAction(applicationId);
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
        const info = await getContractInfoAction(applicationId);
        if (!info) {
          set({ contractStatus: 'success' });
          return;
        }

        set({ contractInfo: info });
        const [html, pdf] = await Promise.all([
          getContractHtmlAction(info.contractId),
          info.status === 'SIGNED' ? getContractPdfUrlAction(info.contractId) : null,
        ]);
        set({ contractHtml: html, pdfUrl: pdf, contractStatus: 'success' });
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

            if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
              set({ showCelebration: true });
              setTimeout(() => set({ showCelebration: false }), 2500);
            }

            // Recargar todo
            const app = await getApplicationDetailAction(appId);
            if (app) set({ application: app, applicationStatus: 'success' });

            const [detailRes, docsRes, contractRes] = await Promise.all([
              getApplicationFullDetailAction(appId),
              listDocumentsAction(appId),
              getContractInfoAction(appId),
            ]);

            set({ fullDetail: detailRes, detailStatus: 'success' });
            set({ documents: docsRes, documentsStatus: 'success' });

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
              set({ contractHtml: html, pdfUrl: pdf, contractStatus: 'success' });
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
