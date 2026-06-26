/**
 * Sistema de permisos de edición para formularios verificados.
 */

/**
 * Política de edición para formularios verificados.
 * - ALWAYS_EDITABLE: edita sin modal
 * - CONFIRM_REQUIRED: muestra modal de confirmación al guardar
 */
export type FormEditPolicy =
  | 'ALWAYS_EDITABLE'
  | 'CONFIRM_REQUIRED';

/**
 * Metadata de edición que define permisos y políticas.
 * Esta data viene enriquecida desde los server actions.
 */
export interface FormEditMetadata {
  /** Si el formulario está verificado por el backend */
  overall_verified: boolean;

  /** Si se puede editar (true = botón visible, false = sin botón) */
  editable: boolean;

  /** Política de edición aplicable */
  edit_policy: FormEditPolicy;
}

/**
 * Props base para todos los formularios con control de edición.
 */
export interface FormWithEditControlProps {
  dashboardMode?: boolean;
  editMetadata?: FormEditMetadata;
  onClose?: () => void;
}

/**
 * Tipo de módulo/formulario del funnel.
 */
export type FormModuleType =
  | 'kyc'
  | 'kyc_documents'
  | 'kyc_selfie'
  | 'labor'
  | 'economic'
  | 'address'
  | 'bank_account'
  | 'references';
