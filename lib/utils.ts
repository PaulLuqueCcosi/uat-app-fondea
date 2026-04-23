export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyFull(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateMonthlyPayment(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  const r = monthlyRate / 100;
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const colors = ['', '#EF4444', '#F59E0B', '#A3E635', '#22C55E'];

  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export function getPasswordRequirements(password: string) {
  return [
    { label: '8+ caracteres', met: password.length >= 8 },
    { label: 'Mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Número', met: /[0-9]/.test(password) },
    { label: 'Símbolo', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPeruvianPhone(phone: string): boolean {
  return /^9\d{8}$/.test(phone.replace(/\s/g, ''));
}

export function isValidDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 9) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
