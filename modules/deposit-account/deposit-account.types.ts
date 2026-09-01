/**
 * Cuenta bancaria a la que el cliente deposita, configurable desde el admin.
 *
 * Espejo de `DepositAccountConfigResponse.java` (módulo `depositos` del backend).
 */

export interface DepositAccountConfig {
  id: string;
  bankName: string;
  accountNumber: string;
  /** Ej: "Ahorros soles". Null si el admin no lo cargó. */
  accountType: string | null;
  /** Código de Cuenta Interbancario — necesario para transferir desde otro banco. */
  cci: string | null;
  holderName: string;
  /** Instrucciones adicionales que escribe el admin. */
  description: string | null;
  /** URL pública del QR en S3. Null si todavía no se subió imagen. */
  qrImageUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

/** Payload para crear una versión nueva. El QR se sube aparte (multipart). */
export interface SaveDepositAccountConfigRequest {
  bankName: string;
  accountNumber: string;
  accountType?: string | null;
  cci?: string | null;
  holderName: string;
  description?: string | null;
  /**
   * Hereda el QR de la config vigente en vez de dejar la nueva sin imagen. Permite
   * corregir solo un dato de texto sin volver a subir la misma imagen.
   */
  keepCurrentQrImage: boolean;
}
