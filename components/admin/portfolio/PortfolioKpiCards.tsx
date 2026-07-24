'use client';

import { useState, useCallback, useEffect } from 'react';
import { DollarSign, RefreshCw, PieChart, Clock } from 'lucide-react';
import { MetricCard, MetricCardSkeleton } from '@/components/admin/metrics/MetricCard';
import type { AverageTicket, Rotation, DistributionByTerm, UpcomingDue } from './types';

function AverageTicketCard() {
  const [data, setData] = useState<AverageTicket | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/average-ticket');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={DollarSign}
      title="Ticket promedio"
      description={`${data.disbursements_this_month} desembolsos este mes`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <p className="text-2xl font-bold text-center">
        S/ {data.average_ticket?.toFixed(0) ?? '—'}
      </p>
    </MetricCard>
  );
}

function RotationCard() {
  const [data, setData] = useState<Rotation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/rotation');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={RefreshCw}
      title="Rotación mensual"
      description={`S/ ${data.total_disbursed_this_month?.toLocaleString() ?? '0'} / S/ ${data.current_portfolio_balance?.toLocaleString() ?? '0'}`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <p className="text-2xl font-bold text-center">
        {data.rotation_rate?.toFixed(1) ?? '—'}x
      </p>
    </MetricCard>
  );
}

function DistributionCard() {
  const [data, setData] = useState<DistributionByTerm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/distribution-by-term');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={PieChart}
      title="Préstamos activos"
      description={`S/ ${data.total_principal?.toLocaleString() ?? '0'}`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
    >
      <p className="text-2xl font-bold text-center">
        {data.total_loans ?? '—'}
      </p>
    </MetricCard>
  );
}

function UpcomingDueCard() {
  const [data, setData] = useState<UpcomingDue | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis/portfolio/analytics/upcoming-due?days=7');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <MetricCardSkeleton />;
  if (!data) return null;

  return (
    <MetricCard
      icon={Clock}
      title="Vencen en 7 días"
      description={`S/ ${data.total_amount?.toLocaleString() ?? '0'}`}
      onRefresh={fetchData}
      isRefreshing={loading && !!data}
      className="[&_.text-primary]:text-amber-500"
    >
      <p className="text-2xl font-bold text-center">
        {data.total_count ?? '—'}
      </p>
    </MetricCard>
  );
}

export function PortfolioKpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AverageTicketCard />
      <RotationCard />
      <DistributionCard />
      <UpcomingDueCard />
    </div>
  );
}
