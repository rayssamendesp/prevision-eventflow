import { supabase } from "@/integrations/supabase/client";

export type EventStatus = "mapeado" | "em_negociacao" | "confirmado" | "realizado";

export type EventRow = {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  status: EventStatus;
  investment_value: number | null;
  important_link: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  event_id: string;
  title: string;
  responsible_user_id: string | null;
  completed: boolean;
  parent_task_id: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  name: string;
  email: string | null;
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  mapeado: "Mapeado",
  em_negociacao: "Em negociação",
  confirmado: "Confirmado",
  realizado: "Realizado",
};

export const STATUS_OPTIONS: EventStatus[] = [
  "mapeado",
  "em_negociacao",
  "confirmado",
  "realizado",
];

export const MONTHS_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function formatShortDate(value: string) {
  const date = parseDate(value);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatLongDate(value: string) {
  const date = parseDate(value);
  return `${date.getDate()} de ${MONTHS_LONG[date.getMonth()]}, ${date.getFullYear()}`;
}

export function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function fetchEvents(archived: boolean) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("archived", archived)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function fetchEvent(id: string) {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as EventRow | null;
}

export async function fetchTasks(eventId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}
