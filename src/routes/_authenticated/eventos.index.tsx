import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { EventFormDialog } from "@/components/event-form-dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  MONTHS_LONG,
  MONTHS_SHORT,
  STATUS_LABEL,
  STATUS_OPTIONS,
  fetchEvents,
  formatShortDate,
  parseDate,
  type EventRow,
  type EventStatus,
} from "@/lib/events";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/eventos/")({
  head: () => ({
    meta: [
      { title: "Eventos Externos | Gestão de Eventos Prevision" },
      {
        name: "description",
        content:
          "Visualização anual dos eventos externos da Prevision organizada por mês, com status e checklist.",
      },
      { property: "og:title", content: "Eventos Externos | Gestão de Eventos Prevision" },
      {
        property: "og:description",
        content: "Visualização anual dos eventos externos da Prevision organizada por mês.",
      },
    ],
  }),
  component: EventosPage,
});

const CARD_ACCENT: Record<EventStatus, string> = {
  mapeado: "",
  em_negociacao: "border-l-2 border-l-negotiation",
  confirmado: "border-l-2 border-l-confirm",
  realizado: "opacity-70",
};

function EventCard({ event }: { event: EventRow }) {
  return (
    <Link
      to="/eventos/$eventId"
      params={{ eventId: event.id }}
      className={cn(
        "group block rounded-xl bg-canvas p-6 ring-1 ring-border transition-shadow hover:shadow-sm",
        CARD_ACCENT[event.status],
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-3">
        <StatusBadge status={event.status} />
        <span className="text-[11px] font-medium text-muted-foreground">
          {formatShortDate(event.event_date)}
        </span>
      </div>
      <h3 className="mb-2 font-display text-lg font-medium leading-tight">{event.name}</h3>
      <p className="text-sm text-muted-foreground">{event.location || "Local a definir"}</p>
    </Link>
  );
}

function EventosPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | EventStatus>("todos");
  const [formOpen, setFormOpen] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", "active"],
    queryFn: () => fetchEvents(false),
  });

  const years = useMemo(() => {
    const set = new Set<number>([now.getFullYear(), year]);
    events.forEach((e) => set.add(parseDate(e.event_date).getFullYear()));
    return [...set].sort();
  }, [events, year, now]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const d = parseDate(e.event_date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return false;
      if (status !== "todos" && e.status !== status) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, year, month, status, search]);

  const monthCounts = useMemo(() => {
    const counts = new Array(12).fill(0) as number[];
    events.forEach((e) => {
      const d = parseDate(e.event_date);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return counts;
  }, [events, year]);

  const confirmedCount = events.filter(
    (e) => e.status === "confirmado" && parseDate(e.event_date).getFullYear() === year,
  ).length;

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10 lg:py-12">
      <header className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 font-display text-3xl font-medium leading-tight lg:text-4xl">
            Eventos Externos
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="cursor-pointer bg-transparent text-sm outline-none hover:text-foreground"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="h-3 w-px bg-border" />
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-confirm" />
              {confirmedCount} confirmados
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar evento"
              className="w-52 rounded-md border border-input bg-canvas py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "todos" | EventStatus)}
            className="rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todos">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary py-2 pl-2 pr-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Novo evento
          </button>
        </div>
      </header>

      <nav className="mb-10 overflow-x-auto border-b border-border">
        <ul className="flex gap-8 pb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {MONTHS_SHORT.map((m, i) => (
            <li key={m}>
              <button
                onClick={() => setMonth(i)}
                className={cn(
                  "relative transition-colors hover:text-foreground",
                  i === month ? "text-foreground" : "",
                )}
              >
                {m}
                {monthCounts[i] ? (
                  <span className="ml-1 text-[9px] text-subtle">{monthCounts[i]}</span>
                ) : null}
                {i === month ? (
                  <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <h2 className="label-caps mb-6">
        {MONTHS_LONG[month]} {year}
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando eventos...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-10 text-center">
          <p className="label-caps">Nenhum evento neste mês</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={`${year}-${String(month + 1).padStart(2, "0")}-01`}
      />
    </section>
  );
}
