'use client';

/**
 * Contexto compartido para todo el flujo de /solicitudes/{id}.
 *
 * Cachea TODOS los datos necesarios para evitar re-fetches al navegar
 * entre resumen, documentos, selfie y contrato.
 *
 * Se recarga solo cuando hay una acción del usuario (subir foto, firmar, etc.)
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ApplicationRecord } from '@/lib/types';
import type { ApplicationFullDetail } from '@/app/actions/application.actions';
import type { DocumentListResult } from '@/app/actions/document.actions';
import type { ContractInfo } from '@/app/actions/contract.actions';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DocumentUrls {
  dniFront: string | null;
  dniBack: string | null;
  selfie: string | null;
}

interface SolicitudContextType {
  // ── Datos de la solicitud ──
  application: ApplicationRecord | null;
  fullDetail: ApplicationFullDetail | null;

  // ── Documentos ──
  documents: DocumentListResult | null;
  documentUrls: DocumentUrls;

  // ── Contrato ──
  contractInfo: ContractInfo | null;
  contractHtml: string | null;
  pdfUrl: string | null;

  // ── Estado ──
  isReady: boolean;

  // ── Setters ──
  setData: (app: ApplicationRecord, detail: ApplicationFullDetail | null) => void;
  setDocuments: (docs: DocumentListResult | null) => void;
  setDocumentUrl: (type: 'dniFront' | 'dniBack' | 'selfie', url: string | null) => void;
  setContractInfo: (info: ContractInfo | null) => void;
  setContractHtml: (html: string | null) => void;
  setPdfUrl: (url: string | null) => void;
}

const SolicitudContext = createContext<SolicitudContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function SolicitudProvider({ children }: { children: ReactNode }) {
  // Solicitud
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [fullDetail, setFullDetail] = useState<ApplicationFullDetail | null>(null);

  // Documentos
  const [documents, setDocumentsState] = useState<DocumentListResult | null>(null);
  const [documentUrls, setDocumentUrls] = useState<DocumentUrls>({
    dniFront: null,
    dniBack: null,
    selfie: null,
  });

  // Contrato
  const [contractInfo, setContractInfoState] = useState<ContractInfo | null>(null);
  const [contractHtml, setContractHtmlState] = useState<string | null>(null);
  const [pdfUrl, setPdfUrlState] = useState<string | null>(null);

  // Estado
  const [isReady, setIsReady] = useState(false);

  // ── Setters estables (useCallback) ──

  const setData = useCallback((app: ApplicationRecord, detail: ApplicationFullDetail | null) => {
    setApplication(app);
    setFullDetail(detail);
    setIsReady(true);
  }, []);

  const setDocuments = useCallback((docs: DocumentListResult | null) => {
    setDocumentsState(docs);
  }, []);

  const setDocumentUrl = useCallback((type: 'dniFront' | 'dniBack' | 'selfie', url: string | null) => {
    setDocumentUrls(prev => ({ ...prev, [type]: url }));
  }, []);

  const setContractInfo = useCallback((info: ContractInfo | null) => {
    setContractInfoState(info);
  }, []);

  const setContractHtml = useCallback((html: string | null) => {
    setContractHtmlState(html);
  }, []);

  const setPdfUrl = useCallback((url: string | null) => {
    setPdfUrlState(url);
  }, []);

  return (
    <SolicitudContext.Provider
      value={{
        application,
        fullDetail,
        documents,
        documentUrls,
        contractInfo,
        contractHtml,
        pdfUrl,
        isReady,
        setData,
        setDocuments,
        setDocumentUrl,
        setContractInfo,
        setContractHtml,
        setPdfUrl,
      }}
    >
      {children}
    </SolicitudContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Valores por defecto cuando no hay provider (flujo /solicitar/) */
const NOOP_CONTEXT: SolicitudContextType = {
  application: null,
  fullDetail: null,
  documents: null,
  documentUrls: { dniFront: null, dniBack: null, selfie: null },
  contractInfo: null,
  contractHtml: null,
  pdfUrl: null,
  isReady: false,
  setData: () => {},
  setDocuments: () => {},
  setDocumentUrl: () => {},
  setContractInfo: () => {},
  setContractHtml: () => {},
  setPdfUrl: () => {},
};

export function useSolicitudData() {
  const context = useContext(SolicitudContext);
  // Si no hay provider (ej: flujo /solicitar/), retornar noop
  if (!context) return NOOP_CONTEXT;
  return context;
}
