/**
 * Configuración del bureau crediticio.
 *
 * Centralizado aquí porque aún no sabemos si será Sentinel, Equifax u otro.
 * Cuando se defina, solo se cambia aquí.
 */

export interface CreditBureauConfig {
  /** Nombre del bureau */
  name: string;
  /** URL del logo (puede ser local o externo) */
  logoUrl: string;
  /** Ancho del logo en px */
  logoWidth: number;
  /** Alto del logo en px */
  logoHeight: number;
  /** URL del sitio web del bureau */
  websiteUrl: string;
}

export const CREDIT_BUREAU: CreditBureauConfig = {
  name: 'Sentinel',
  logoUrl: '/images/sentinel-logo.png',
  logoWidth: 80,
  logoHeight: 20,
  websiteUrl: 'https://misentinel.com.pe/',
};
