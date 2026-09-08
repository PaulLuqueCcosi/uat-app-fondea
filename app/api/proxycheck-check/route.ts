/**
 * GET /api/proxycheck-check?ip=xxx
 *
 * Proxy → proxycheck.io v3 API
 * Consulta proxycheck.io para detectar VPN/proxy/TOR de una IP.
 * Oculta la API key del frontend.
 */

import { NextRequest, NextResponse } from 'next/server';

const PROXYCHECK_API_KEY = process.env.PROXYCHECK_API_KEY;
const RISK_SCORE_THRESHOLD = 65;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');

  if (!ip) {
    return NextResponse.json({ error: 'IP address required' }, { status: 400 });
  }

  try {
    // Construir URL: con o sin API key (sin key = plan gratuito 100 consultas/día)
    let url = `http://proxycheck.io/v3/${encodeURIComponent(ip)}?ver=11-February-2026`;
    if (PROXYCHECK_API_KEY) {
      url += `&key=${PROXYCHECK_API_KEY}`;
    }

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      console.error('[ProxyCheck] Error HTTP:', res.status);
      return NextResponse.json({
        consulted: false,
        proxy: false,
        vpn: false,
        tor: false,
        risk_score: 0,
        reason: `ProxyCheck HTTP ${res.status}`,
      });
    }

    const data = await res.json();

    // Verificar status de la API
    if (data.status === 'denied' || data.status === 'error') {
      console.error('[ProxyCheck] API error:', data.status, data.message);
      return NextResponse.json({
        consulted: false,
        proxy: false,
        vpn: false,
        tor: false,
        risk_score: 0,
        reason: data.message || `ProxyCheck ${data.status}`,
      });
    }

    // Extraer datos del IP específico
    const ipData = data[ip];
    if (!ipData) {
      return NextResponse.json({
        consulted: false,
        proxy: false,
        vpn: false,
        tor: false,
        risk_score: 0,
        reason: 'No data for IP',
      });
    }

    // Parsear detecciones
    const detections = ipData.detections || {};
    const riskScore = typeof ipData.risk_score === 'number' ? ipData.risk_score : 0;
    const confidence = typeof detections.confidence === 'number' ? detections.confidence : null;

    const result = {
      consulted: true,
      ip,
      proxy: detections.proxy === true,
      vpn: detections.vpn === true,
      tor: detections.tor === true,
      hosting: detections.hosting === true,
      scraper: detections.scraper === true,
      compromised: detections.compromised === true,
      anonymous: detections.anonymous === true,
      risk_score: riskScore,
      risk_score_high: riskScore >= RISK_SCORE_THRESHOLD,
      risk_score_threshold: RISK_SCORE_THRESHOLD,
      confidence,
      network_type: ipData.network?.type ?? null,
      provider: ipData.network?.provider ?? null,
      organisation: ipData.network?.organisation ?? null,
      asn: ipData.network?.asn ?? null,
      country_code: ipData.location?.country?.code ?? null,
      city: ipData.location?.city ?? null,
      region: ipData.location?.region ?? null,
      operator_name: ipData.operator?.name ?? null,
      operator_anonymity: ipData.operator?.anonymity ?? null,
      attack_history: ipData.attack_history ?? null,
      detection_history: ipData.detection_history ?? null,
    };

    console.log('[ProxyCheck] Result for', ip, ':', {
      proxy: result.proxy,
      vpn: result.vpn,
      tor: result.tor,
      risk_score: result.risk_score,
      risk_score_high: result.risk_score_high,
    });
    // Detalle de POR QUÉ proxycheck.io clasificó esta IP así — útil para
    // distinguir un falso positivo (ej. IP de datacenter/ISP corporativo)
    // de un proxy/VPN real (ej. IP de NordVPN, Cloudflare WARP, etc.)
    console.log('[ProxyCheck] Detalle de detección para', ip, ':', {
      hosting: result.hosting,
      anonymous: result.anonymous,
      scraper: result.scraper,
      compromised: result.compromised,
      confidence: result.confidence,
      network_type: result.network_type,
      provider: result.provider,
      organisation: result.organisation,
      asn: result.asn,
      operator_name: result.operator_name,
      operator_anonymity: result.operator_anonymity,
      country_code: result.country_code,
      city: result.city,
      region: result.region,
      attack_history: result.attack_history,
      detection_history: result.detection_history,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ProxyCheck] Exception:', error);
    return NextResponse.json({
      consulted: false,
      proxy: false,
      vpn: false,
      tor: false,
      risk_score: 0,
      reason: 'Network error',
    });
  }
}
