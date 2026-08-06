import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clases para inputs/selects/botones deshabilitados en modo "solo lectura"
 * (ej: viendo una config ACTIVE/ARCHIVED). El estilo `disabled` por defecto
 * (opacity-50, bg gris) comunica "roto/inactivo" — acá queremos que se vea
 * como contenido, no como un formulario apagado.
 */
export const READONLY_FIELD_CLASS =
  "disabled:cursor-default disabled:opacity-100 disabled:border-border/40 disabled:bg-transparent disabled:text-foreground"

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function calculateMonthlyPayment(
  amount: number,
  monthlyRate: number,
  months: number
): number {
  const rate = monthlyRate / 100
  const payment = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
  return Math.round(payment * 100) / 100
}

export function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
