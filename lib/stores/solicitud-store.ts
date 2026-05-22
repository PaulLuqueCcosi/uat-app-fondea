import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import type { ApplicationFullDetail, ApplicationIntention } from '@/app/actions/application.actions';
import type { DocumentListResult } from '@/app/actions/document.actions';
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
  // ── ID de la solicitud activa ──
  applicationId: string | null;

  // ── Application ──
  application: ApplicationRecord | null;
  applicationReady: boolean;
  applicationNotFound: boolean;

  // ── Full Detail ──
  fullDetail: ApplicationFullDetail | null;
  fullDetailReady: boolean;

  // ── Documents ──
  documents: DocumentListResult | null;
  documentsReady: boolean;
  documentUrls: DocumentUrls;

  // ── Contract ──
  contractInfo: ContractInfo | null;
  contractHtml: string | null;
  pdfUrl: string | null;
  contractReady: boolean;

  // ── UI ──
  showCelebration: boolean;

  // ── Intención de la solicitud (para mostrar durante polling) ──
  applicationIntention: ApplicationIntention | null;

  // ── Polling ──
  isPolling: boolean;
  _pollingInterval: ReturnType<typeof setInterval> | null;
  _pollingAttempts: number;
}

interface SolicitudActions {
  // ── Inicializar con un applicationId ──
  init: (applicationId: string) => void;
  reset: () => void;

  // ── UI ──
  dismissCelebration: () => void;

  // ── Fetch bajo demanda (no recarga si ya tiene datos) ──
  fetchApplication: () => Promise<ApplicationRecord | null>;
  fetchFullDetail: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchContract: () => Promise<void>;

  // ── Refresh (fuerza recarga del server) ──
  refreshDocuments: () => Promise<void>;
  refreshContract: () => Promise<void>;

  // ── Actualizar en memoria ──
  setDocumentUrl: (type: keyof DocumentUrls, url: string | null) => void;

  // ── Polling ──
  startPolling: () => void;
  stopPolling: () => void;
}

type SolicitudStore = SolicitudState & SolicitudActions;

// ── Estado inicial ────────────────────────────────────────────────────────────

const INITIAL_STATE: SolicitudState = {
  applicationId: null,
  application: null,
  applicationReady: false,
  applicationNotFound: false,
  fullDetail: null,
  fullDetailReady: false,
  documents: null,
  documentsReady: false,
  documentUrls: { dniFront: null, dniBack: null, selfie: null },
  contractInfo: null,
  contractHtml: null,
  pdfUrl: null,
  contractReady: false,
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

    // ── Init / Reset ──

    init: (applicationId: string) => {
      const current = get().applicationId;
      if (current === applicationId) return; // ya inicializado con este ID
      // Reset si cambió el ID
      get().stopPolling();
      set({ ...INITIAL_STATE, applicationId });
    },

    reset: () => {
      get().stopPolling();
      set(INITIAL_STATE);
    },

    dismissCelebration: () => {
      set({ showCelebration: false });
    },

    // ── Fetch Application ──

    fetchApplication: async () => {
      const { application, applicationId, applicationReady } = get();
      if (application) return application;
      if (!applicationId || applicationReady) return null;

      try {
        const app = await getApplicationDetailAction(applicationId);
        if (!app) {
          set({ applicationReady: true, applicationNotFound: true });
          return null;
        }
        set({ application: app, applicationReady: true });
        return app;
      } catch (err) {
        console.error('[SolicitudStore] Error fetching application:', err);
        set({ applicationReady: true });
        return null;
      }
    },

    // ── Fetch Full Detail ──

    fetchFullDetail: async () => {
      const { fullDetail, applicationId, fullDetailReady } = get();
      if (fullDetail || !applicationId || fullDetailReady) return;

      try {
        const detail = await getApplicationFullDetailAction(applicationId);
        set({ fullDetail: detail, fullDetailReady: true });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching full detail:', err);
        set({ fullDetailReady: true });
      }
    },

    // ── Fetch Documents ──

    fetchDocuments: async () => {
      const { documents, applicationId, documentsReady } = get();
      if (documents || !applicationId || documentsReady) return;

      try {
        const docs = await listDocumentsAction(applicationId);
        if (!docs) {
          set({ documents: null, documentsReady: true });
          return;
        }

        set({ documents: docs });

        // Cargar URLs en paralelo
        const frontDoc = docs.documents.find(d => d.type === 'DNI_FRONT' && d.status === 'UPLOADED');
        const backDoc = docs.documents.find(d => d.type === 'DNI_BACK' && d.status === 'UPLOADED');
        const selfieDoc = docs.documents.find(d => d.type === 'SELFIE' && d.status === 'UPLOADED');

        const [dniFront, dniBack, selfie] = await Promise.all([
          frontDoc ? getDocumentUrlAction(applicationId, 'DNI_FRONT') : null,
          backDoc ? getDocumentUrlAction(applicationId, 'DNI_BACK') : null,
          selfieDoc ? getDocumentUrlAction(applicationId, 'SELFIE') : null,
        ]);

        set({ documentUrls: { dniFront, dniBack, selfie }, documentsReady: true });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching documents:', err);
        set({ documentsReady: true });
      }
    },

    // ── Fetch Contract ──

    fetchContract: async () => {
      const { contractInfo, applicationId, contractReady } = get();
      if (contractInfo || !applicationId || contractReady) return;

      set({  });

      try {
        const info = await getContractInfoAction(applicationId);
        if (!info) {
          set({ contractReady: true });
          return;
        }

        set({ contractInfo: info });

        const [html, pdf] = await Promise.all([
          getContractHtmlAction(info.contractId),
          info.status === 'SIGNED' ? getContractPdfUrlAction(info.contractId) : null,
        ]);

        set({ contractHtml: html, pdfUrl: pdf, contractReady: true });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching contract:', err);
        set({ contractReady: true });
      }
    },

    // ── Refresh (fuerza recarga) ──

    refreshDocuments: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ documentsReady: false });

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
        set({ documentsReady: true });
      }
    },

    refreshContract: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({  });

      try {
        const info = await getContractInfoAction(applicationId);
        if (info) {
          set({ contractInfo: info });
          const [html, pdf] = await Promise.all([
            getContractHtmlAction(info.contractId),
            info.status === 'SIGNED' ? getContractPdfUrlAction(info.contractId) : null,
          ]);
          set({ contractHtml: html, pdfUrl: pdf });
        }
      } finally {
        set({ contractReady: true });
      }
    },

    // ── Actualizar en memoria ──

    setDocumentUrl: (type, url) => {
      set({ documentUrls: { ...get().documentUrls, [type]: url } });
    },

    // ── Polling ──

    startPolling: () => {
      const { _pollingInterval, applicationId } = get();
      if (_pollingInterval || !applicationId) return;

      set({ isPolling: true, _pollingAttempts: 0 });

      // Cargar la intención de la solicitud para mostrar en el sidebar durante polling
      getApplicationIntentionAction(applicationId)
        .then((intention) => {
          if (intention) {
            set({ applicationIntention: intention });
          }
        })
        .catch(() => {});

      const poll = async () => {
        const { applicationId: appId, _pollingAttempts } = get();
        if (!appId) return;

        if (_pollingAttempts >= MAX_POLL_ATTEMPTS) {
          get().stopPolling();
          set({ application: get().application ? { ...get().application!, status: 'FAILED' as ApplicationStatus } : null });
          return;
        }

        set({ _pollingAttempts: _pollingAttempts + 1 });

        try {
          const status = await getApplicationStatusAction(appId);
          if (!status) return;

          if (status !== 'SUBMITTED' && status !== 'PROCESSING') {
            get().stopPolling();

            // Celebración si fue pre-aprobada
            if (status === 'PRE_APPROVED' || status === 'PENDING_DOCUMENTS') {
              set({ showCelebration: true });
              setTimeout(() => set({ showCelebration: false }), 2500);
            }

            // Cargar todos los datos ahora que hay resultado
            const app = await getApplicationDetailAction(appId);
            if (app) set({ application: app });

            // Disparar carga de todo en paralelo
            const detail = getApplicationFullDetailAction(appId);
            const docs = listDocumentsAction(appId);
            const contract = getContractInfoAction(appId);

            const [detailRes, docsRes, contractRes] = await Promise.all([detail, docs, contract]);

            set({ fullDetail: detailRes, fullDetailReady: true });
            set({ documents: docsRes, documentsReady: true });

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
              set({ contractHtml: html, pdfUrl: pdf, contractReady: true });
            }
          }
        } catch (err) {
          console.error('[SolicitudStore] Polling error:', err);
        }
      };

      // Primera llamada inmediata
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
