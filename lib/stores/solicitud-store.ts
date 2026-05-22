import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';
import type { ApplicationFullDetail } from '@/app/actions/application.actions';
import type { DocumentListResult } from '@/app/actions/document.actions';
import type { ContractInfo } from '@/app/actions/contract.actions';
import {
  getApplicationDetailAction,
  getApplicationFullDetailAction,
  getApplicationStatusAction,
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
  applicationLoading: boolean;

  // ── Full Detail ──
  fullDetail: ApplicationFullDetail | null;
  fullDetailLoading: boolean;

  // ── Documents ──
  documents: DocumentListResult | null;
  documentsLoading: boolean;
  documentUrls: DocumentUrls;

  // ── Contract ──
  contractInfo: ContractInfo | null;
  contractHtml: string | null;
  pdfUrl: string | null;
  contractLoading: boolean;

  // ── Polling ──
  isPolling: boolean;
  _pollingInterval: ReturnType<typeof setInterval> | null;
  _pollingAttempts: number;
}

interface SolicitudActions {
  // ── Inicializar con un applicationId ──
  init: (applicationId: string) => void;
  reset: () => void;

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
  applicationLoading: false,
  fullDetail: null,
  fullDetailLoading: false,
  documents: null,
  documentsLoading: false,
  documentUrls: { dniFront: null, dniBack: null, selfie: null },
  contractInfo: null,
  contractHtml: null,
  pdfUrl: null,
  contractLoading: false,
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

    // ── Fetch Application ──

    fetchApplication: async () => {
      const { application, applicationId, applicationLoading } = get();
      if (application) return application;
      if (!applicationId || applicationLoading) return null;

      set({ applicationLoading: true });

      try {
        const app = await getApplicationDetailAction(applicationId);
        set({ application: app, applicationLoading: false });
        return app;
      } catch (err) {
        console.error('[SolicitudStore] Error fetching application:', err);
        set({ applicationLoading: false });
        return null;
      }
    },

    // ── Fetch Full Detail ──

    fetchFullDetail: async () => {
      const { fullDetail, applicationId, fullDetailLoading } = get();
      if (fullDetail || !applicationId || fullDetailLoading) return;

      set({ fullDetailLoading: true });

      try {
        const detail = await getApplicationFullDetailAction(applicationId);
        set({ fullDetail: detail, fullDetailLoading: false });
      } catch (err) {
        console.error('[SolicitudStore] Error fetching full detail:', err);
        set({ fullDetailLoading: false });
      }
    },

    // ── Fetch Documents ──

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

        // Cargar URLs en paralelo
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

    // ── Fetch Contract ──

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

    // ── Refresh (fuerza recarga) ──

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

    refreshContract: async () => {
      const { applicationId } = get();
      if (!applicationId) return;

      set({ contractLoading: true });

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
        set({ contractLoading: false });
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

            // Cargar todos los datos ahora que hay resultado
            const app = await getApplicationDetailAction(appId);
            if (app) set({ application: app });

            // Disparar carga de todo en paralelo
            const detail = getApplicationFullDetailAction(appId);
            const docs = listDocumentsAction(appId);
            const contract = getContractInfoAction(appId);

            const [detailRes, docsRes, contractRes] = await Promise.all([detail, docs, contract]);

            set({ fullDetail: detailRes, fullDetailLoading: false });
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
