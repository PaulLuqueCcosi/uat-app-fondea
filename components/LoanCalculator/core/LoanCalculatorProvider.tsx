'use client';

import { createContext, useContext } from "react";
import type { LoanCalculatorApi, LoanCalculatorTheme } from "./types";

// ── Context ───────────────────────────────────────────────────────────────────

interface LoanCalculatorContextValue {
  api: LoanCalculatorApi;
  theme?: LoanCalculatorTheme;
}

const LoanCalculatorContext = createContext<LoanCalculatorContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

interface ProviderProps {
  api: LoanCalculatorApi;
  theme?: LoanCalculatorTheme;
  children: React.ReactNode;
}

export function LoanCalculatorProvider({ api, theme, children }: ProviderProps) {
  return (
    <LoanCalculatorContext.Provider value={{ api, theme }}>
      {theme ? (
        <div
          style={{
            "--lc-primary": theme.primary,
            "--lc-primary-dark": theme.primaryDark,
            "--lc-primary-light": theme.primaryLight,
            "--lc-text": theme.text,
            "--lc-muted": theme.muted,
            "--lc-border": theme.border,
            "--lc-bg": theme.background,
            "--lc-header-bg": theme.headerBg,
            "--lc-header-text": theme.headerText,
          } as React.CSSProperties}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </LoanCalculatorContext.Provider>
  );
}

// ── Hook para consumir ────────────────────────────────────────────────────────

export function useLoanCalculatorApi(): LoanCalculatorApi {
  const ctx = useContext(LoanCalculatorContext);
  if (!ctx) {
    throw new Error("LoanCalculator debe estar envuelto en <LoanCalculatorProvider>");
  }
  return ctx.api;
}

export function useLoanCalculatorTheme(): LoanCalculatorTheme | undefined {
  const ctx = useContext(LoanCalculatorContext);
  return ctx?.theme;
}
