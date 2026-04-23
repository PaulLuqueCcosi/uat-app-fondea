import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
