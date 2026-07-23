/**
 * GET /api/admin/fee-groups-active
 *
 * Returns the fee groups data from the active FEE_GROUPS version.
 * Used by PricingRulesEditor to show available fee groups for selection.
 */

import { NextResponse } from 'next/server';
import { getAccessTokenRSC } from '@logto/next/server-actions';
import { logtoConfig } from '@/app/logto';

const CALCULATOR_URL = process.env.CALCULATOR_API_URL ?? 'http://localhost:8080';
const RESOURCE = process.env.LOGTO_API_RESOURCE;

export async function GET() {
  try {
    const token = await getAccessTokenRSC(logtoConfig, RESOURCE);

    // Get active summary to find the FEE_GROUPS active version
    const summaryRes = await fetch(`${CALCULATOR_URL}/api/admin/pricing/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!summaryRes.ok) return NextResponse.json([], { status: 200 });

    const summary = await summaryRes.json();
    const feeGroupsVersion = summary.FEE_GROUPS;
    if (!feeGroupsVersion?.id) return NextResponse.json([], { status: 200 });

    // Get the full version with data
    const versionRes = await fetch(
      `${CALCULATOR_URL}/api/admin/pricing/versions/FEE_GROUPS/${feeGroupsVersion.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!versionRes.ok) return NextResponse.json([], { status: 200 });

    const version = await versionRes.json();
    return NextResponse.json(version.data ?? [], { status: 200 });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
