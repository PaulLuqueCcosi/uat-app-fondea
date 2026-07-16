/**
 * GET /api/admin/dashboard/kpis?days=30
 *
 * Proxy para KPIs del dashboard admin.
 * Usa el nuevo módulo dashboardAdmin/kpis del backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get('days') ?? '30';

  let token: string | undefined;
  try {
    token = await getAccessTokenRSC(logtoConfig, RESOURCE);
  } catch (err) {
    console.error('[ADMIN-DASHBOARD-API] ❌ Error al obtener access token:', err);
    return NextResponse.json({ error: 'token_error' }, { status: 401 });
  }

  if (!token) {
    return NextResponse.json({ error: 'no_token' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/dashboard-kpis/all?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[ADMIN-DASHBOARD-API] Backend error ${res.status}: ${text}`);
      return NextResponse.json({ error: 'backend_error', detail: text }, { status: res.status });
    }

    const data = await res.json();

    // Map from new format to the format the frontend expects
    const mapped = {
      activeLoansCount: data.active_loans?.count ?? 0,
      activeLoansPrincipal: data.active_loans?.total_principal ?? 0,
      portfolioCapitalBase: data.capital?.total_capital ?? 0,
      capitalAvailable: data.capital?.available ?? 0,
      portfolioUtilizationRate: data.capital?.utilization_rate ?? 0,
      overdueLoansCount: 0,
      overdueLoansPrincipal: data.npl?.overdue_capital ?? 0,
      nplGeneralRate: data.npl?.general_rate ?? 0,
      nplTramos: {
        d1_30: data.npl?.tranches?.[0]?.loan_count ?? 0,
        d31_60: data.npl?.tranches?.[1]?.loan_count ?? 0,
        d61_90: data.npl?.tranches?.[2]?.loan_count ?? 0,
        d91_plus: data.npl?.tranches?.[3]?.loan_count ?? 0,
        rate1_30: data.npl?.tranches?.[0]?.rate ?? 0,
        rate31_60: data.npl?.tranches?.[1]?.rate ?? 0,
        rate61_90: data.npl?.tranches?.[2]?.rate ?? 0,
        rate91_plus: data.npl?.tranches?.[3]?.rate ?? 0,
      },
      grossIncomeLastDays: data.income?.accumulated_income ?? 0,
      incomeToday: data.income?.income_today ?? 0,
      nps: {
        totalResponses: data.nps?.total_responses ?? 0,
        promoters: data.nps?.promoters ?? 0,
        passives: data.nps?.passives ?? 0,
        detractors: data.nps?.detractors ?? 0,
        npsScore: data.nps?.nps_score ?? 0,
      },
      funnel: {
        anonymousIntentions: data.funnel?.anonymous_intentions ?? 0,
        userIntentions: data.funnel?.user_intentions ?? 0,
        applicationsSubmitted: data.funnel?.applications_submitted ?? 0,
        applicationsApproved: data.funnel?.applications_approved ?? 0,
        creditsDisbursed: data.funnel?.credits_disbursed ?? 0,
        landingToRegisterRate: 0,
        intentionToAppRate: 0,
        appToApprovalRate: 0,
        approvalToDisburseRate: 0,
      },
      activeClientsCount: data.active_clients?.count ?? 0,
      repurchaseRate: data.repurchase_rate?.rate ?? 0,
      cityDistribution: (data.city_distribution?.cities ?? []).map((c: any) => ({
        city: c.city,
        loanCount: c.loan_count,
        percentage: c.percentage,
      })),
    };

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('[ADMIN-DASHBOARD-API] ❌ Network error:', err);
    return NextResponse.json({ error: 'network_error' }, { status: 503 });
  }
}
