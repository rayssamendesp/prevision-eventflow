import { supabase } from "@/integrations/supabase/client";

export type RoiKind = "cafe" | "sponsored";
export type RoiDirection = "expense" | "income";

export type RoiEventRow = {
  id: string;
  kind: RoiKind;
  sponsored_event_id: string | null;
  name: string;
  event_date: string | null;
  mqls_evolved: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RoiFinancialEntryRow = {
  id: string;
  roi_event_id: string;
  direction: RoiDirection;
  category: string;
  description: string | null;
  amount: number;
  created_at: string;
};

export type RoiSaleRow = {
  id: string;
  roi_event_id: string;
  client_name: string | null;
  client_count: number;
  close_date: string | null;
  mrr: number;
  mrr_year_override: number | null;
  implementation: number;
  created_at: string;
};

export type RoiEventBundle = RoiEventRow & {
  financialEntries: RoiFinancialEntryRow[];
  sales: RoiSaleRow[];
};

export type RoiMetrics = {
  expenses: number;
  income: number;
  netCost: number;
  clientCount: number;
  mrr: number;
  mrrYear: number;
  implementation: number;
  revenue: number;
  roi: number;
  roiPercent: number | null;
  mqlsEvolved: number;
};

export type SponsoredEventOption = {
  id: string;
  name: string;
  event_date: string | null;
  investment_value: number | null;
};

export function monthsRemainingInYear(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  return 12 - date.getMonth();
}

export function saleMrrYear(sale: Pick<RoiSaleRow, "mrr" | "mrr_year_override" | "close_date">) {
  if (sale.mrr_year_override != null) return Number(sale.mrr_year_override);
  if (!sale.close_date) return 0;
  return Number(sale.mrr) * monthsRemainingInYear(sale.close_date);
}

export function calculateRoiMetrics(bundle: RoiEventBundle): RoiMetrics {
  const expenses = bundle.financialEntries
    .filter((entry) => entry.direction === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const income = bundle.financialEntries
    .filter((entry) => entry.direction === "income")
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const netCost = expenses - income;

  const clientCount = bundle.sales.reduce((sum, sale) => sum + Number(sale.client_count || 0), 0);
  const mrr = bundle.sales.reduce((sum, sale) => sum + Number(sale.mrr || 0), 0);
  const mrrYear = bundle.sales.reduce((sum, sale) => sum + saleMrrYear(sale), 0);
  const implementation = bundle.sales.reduce(
    (sum, sale) => sum + Number(sale.implementation || 0),
    0,
  );
  const revenue = mrrYear + implementation;
  const roi = revenue - netCost;
  const roiPercent = netCost === 0 ? null : (roi / netCost) * 100;

  return {
    expenses,
    income,
    netCost,
    clientCount,
    mrr,
    mrrYear,
    implementation,
    revenue,
    roi,
    roiPercent,
    mqlsEvolved: Number(bundle.mqls_evolved || 0),
  };
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatPercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatRoiDate(value: string | null) {
  if (!value) return "Data a confirmar";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export async function fetchRoiBundles(kind: RoiKind): Promise<RoiEventBundle[]> {
  const { data: events, error: eventsError } = await supabase
    .from("roi_events")
    .select("*")
    .eq("kind", kind)
    .order("event_date", { ascending: true, nullsFirst: false });

  if (eventsError) throw eventsError;
  const typedEvents = (events ?? []) as RoiEventRow[];
  if (typedEvents.length === 0) return [];

  const ids = typedEvents.map((event) => event.id);
  const [financialResponse, salesResponse] = await Promise.all([
    supabase
      .from("roi_financial_entries")
      .select("*")
      .in("roi_event_id", ids)
      .order("created_at", { ascending: true }),
    supabase
      .from("roi_sales")
      .select("*")
      .in("roi_event_id", ids)
      .order("created_at", { ascending: true }),
  ]);

  if (financialResponse.error) throw financialResponse.error;
  if (salesResponse.error) throw salesResponse.error;

  const financial = (financialResponse.data ?? []) as RoiFinancialEntryRow[];
  const sales = (salesResponse.data ?? []) as RoiSaleRow[];

  return typedEvents.map((event) => ({
    ...event,
    financialEntries: financial.filter((entry) => entry.roi_event_id === event.id),
    sales: sales.filter((sale) => sale.roi_event_id === event.id),
  }));
}

export async function fetchSponsoredEventOptions(): Promise<SponsoredEventOption[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, event_date, investment_value")
    .order("event_date", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as SponsoredEventOption[];
}

export async function deleteRoiEvent(id: string) {
  const { error } = await supabase.from("roi_events").delete().eq("id", id);
  if (error) throw error;
}
