export interface DashboardKpiResponse {
  activeLoansCount: number;
  activeLoansPrincipal: number;
  portfolioCapitalBase: number;
  capitalAvailable: number;
  portfolioUtilizationRate: number;
  overdueLoansCount: number;
  overdueLoansPrincipal: number;
  nplGeneralRate: number;
  nplTramos: {
    d1_30: number;
    d31_60: number;
    d61_90: number;
    d91_plus: number;
    rate1_30: number;
    rate31_60: number;
    rate61_90: number;
    rate91_plus: number;
  };
  grossIncomeLastDays: number;
  incomeToday: number;
  nps: {
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    npsScore: number;
  };
  funnel: {
    anonymousIntentions: number;
    userIntentions: number;
    applicationsSubmitted: number;
    applicationsApproved: number;
    creditsDisbursed: number;
    landingToRegisterRate: number;
    intentionToAppRate: number;
    appToApprovalRate: number;
    approvalToDisburseRate: number;
  };
  activeClientsCount: number;
  repurchaseRate: number;
  cityDistribution: { city: string; loanCount: number; percentage: number }[];
}

export async function getDashboardKpis(days: number = 30): Promise<DashboardKpiResponse> {
  const res = await fetch(`/api/admin/dashboard/kpis?days=${days}`);
  if (!res.ok) throw new Error('Error cargando KPIs del dashboard');
  return res.json();
}
