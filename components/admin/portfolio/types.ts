export interface TermSegment {
  term_days: number;
  loan_count: number;
  percentage: number;
}

export interface DistributionByTerm {
  total_loans: number;
  total_principal: number;
  segments: TermSegment[];
}

export interface AmountBucket {
  range_label: string;
  range_min: number;
  range_max: number;
  loan_count: number;
  percentage: number;
}

export interface DistributionByAmount {
  total_loans: number;
  buckets: AmountBucket[];
}

export interface AverageTicket {
  average_ticket: number;
  disbursements_this_month: number;
}

export interface Rotation {
  rotation_rate: number;
  total_disbursed_this_month: number;
  current_portfolio_balance: number;
}

export interface Cohort {
  month: string;
  total_clients: number;
  retention_30d: number | null;
  retention_60d: number | null;
  retention_90d: number | null;
}

export interface Cohorts {
  cohorts: Cohort[];
}

export interface UpcomingDueLoan {
  credit_id: string;
  client_name: string | null;
  client_document: string;
  principal: number;
  days_until_due: number;
}

export interface UpcomingDue {
  total_count: number;
  total_amount: number;
  loans: UpcomingDueLoan[];
}

export interface PortfolioAnalyticsData {
  distributionByTerm: DistributionByTerm | null;
  distributionByAmount: DistributionByAmount | null;
  averageTicket: AverageTicket | null;
  rotation: Rotation | null;
  cohorts: Cohorts | null;
  upcomingDue: UpcomingDue | null;
}
