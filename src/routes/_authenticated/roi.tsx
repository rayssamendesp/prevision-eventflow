import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Database,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { RoiEventDialog } from "@/components/roi-event-dialog";
import {
  calculateRoiMetrics,
  deleteRoiEvent,
  fetchRoiBundles,
  fetchSponsoredEventOptions,
  formatMoney,
  formatPercent,
  formatRoiDate,
  type RoiEventBundle,
  type RoiKind,
} from "@/lib/roi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/roi")({
  head: () => ({
    meta: [
      { title: "ROI dos Eventos | Prevision" },
      {
        name: "description",
        content: "Dashboard executivo e alimentação dos dados de ROI do Café Prevision e eventos patrocinados.",
      },
    ],
  }),
  component: RoiPage,
});

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-3 font-display text-2xl font-medium tracking-tight">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function EmptyState({ management }: { management: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-foreground/[0.015] px-6 py-14 text-center">
      <BarChart3 className="mx-auto size-7 text-muted-foreground" />
      <p className="mt-4 text-sm font-medium">Nenhum dado de ROI neste período</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {management
          ? "Adicione um evento para começar a alimentar os dados."
          : "Use Gerenciar dados para incluir eventos e resultados."}
      </p>
    </div>
  );
}

function EventDetail({ bundle }: { bundle: RoiEventBundle }) {
  const metrics = calculateRoiMetrics(bundle);
  const expenses = bundle.financialEntries.filter((entry) => entry.direction === "expense");
  const income = bundle.financialEntries.filter((entry) => entry.direction === "income");

  return (
    <div className="mt-5 rounded-xl border border-border bg-foreground/[0.015] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps">Detalhamento</p>
          <h3 className="mt-1 font-display text-lg font-medium">{bundle.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{formatRoiDate(bundle.event_date)}</p>
        </div>
        <div className="text-right">
          <p className="label-caps">ROI</p>
          <p className={cn("mt-1 text-lg font-semibold", metrics.roi >= 0 ? "text-confirm" : "text-destructive")}>
            {formatMoney(metrics.roi)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="label-caps">Saídas</p>
          <p className="mt-1 text-sm font-semibold">{formatMoney(metrics.expenses)}</p>
        </div>
        <div>
          <p className="label-caps">Entradas</p>
          <p className="mt-1 text-sm font-semibold">{formatMoney(metrics.income)}</p>
        </div>
        <div>
          <p className="label-caps">Custo líquido</p>
          <p className="mt-1 text-sm font-semibold">{formatMoney(metrics.netCost)}</p>
        </div>
        <div>
          <p className="label-caps">MRR mensal</p>
          <p className="mt-1 text-sm font-semibold">{formatMoney(metrics.mrr)}</p>
        </div>
        <div>
          <p className="label-caps">MRR Ano</p>
          <p className="mt-1 text-sm font-semibold">{formatMoney(metrics.mrrYear)}</p>
        </div>
        <div>
          <p className="label-caps">Implantação</p>
          <p className="mt-1 text-sm font-semibold">{formatMoney(metrics.implementation)}</p>
        </div>
      </div>

      {expenses.length > 0 || income.length > 0 ? (
        <div className="mt-6 grid gap-5 border-t border-border pt-5 md:grid-cols-2">
          <div>
            <p className="label-caps mb-3">Composição das saídas</p>
            <div className="space-y-2">
              {expenses.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{entry.category}</span>
                  <span className="font-medium">{formatMoney(Number(entry.amount))}</span>
                </div>
              ))}
              {expenses.length === 0 ? <span className="text-xs text-muted-foreground">Sem saídas.</span> : null}
            </div>
          </div>
          <div>
            <p className="label-caps mb-3">Entradas</p>
            <div className="space-y-2">
              {income.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{entry.category}</span>
                  <span className="font-medium">{formatMoney(Number(entry.amount))}</span>
                </div>
              ))}
              {income.length === 0 ? <span className="text-xs text-muted-foreground">Sem entradas.</span> : null}
            </div>
          </div>
        </div>
      ) : null}

      {bundle.sales.length > 0 ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className="label-caps mb-3">Clientes / vendas vinculadas</p>
          <div className="space-y-2">
            {bundle.sales.map((sale) => (
              <div
                key={sale.id}
                className="grid gap-2 rounded-md bg-canvas px-3 py-3 text-sm sm:grid-cols-[1fr_auto_auto]"
              >
                <span className="font-medium">{sale.client_name || "Cliente sem nome"}</span>
                <span className="text-muted-foreground">MRR {formatMoney(Number(sale.mrr))}</span>
                <span className="text-muted-foreground">
                  Implantação {formatMoney(Number(sale.implementation))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoiPage() {
  const now = new Date();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<RoiKind>("cafe");
  const [management, setManagement] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<RoiEventBundle | null>(null);

  const bundlesQuery = useQuery({
    queryKey: ["roi", kind],
    queryFn: () => fetchRoiBundles(kind),
  });

  const sponsoredOptionsQuery = useQuery({
    queryKey: ["sponsored-event-options"],
    queryFn: fetchSponsoredEventOptions,
  });

  const bundles = bundlesQuery.data ?? [];
  const years = useMemo(() => {
    const result = new Set<number>([now.getFullYear(), year]);
    bundles.forEach((bundle) => {
      if (bundle.event_date) result.add(Number(bundle.event_date.slice(0, 4)));
    });
    return [...result].sort((a, b) => a - b);
  }, [bundles, now, year]);

  const yearBundles = useMemo(
    () =>
      bundles.filter(
        (bundle) => !bundle.event_date || Number(bundle.event_date.slice(0, 4)) === year,
      ),
    [bundles, year],
  );

  const summaries = useMemo(
    () => yearBundles.map((bundle) => ({ bundle, metrics: calculateRoiMetrics(bundle) })),
    [yearBundles],
  );

  const totals = useMemo(
    () =>
      summaries.reduce(
        (acc, item) => {
          acc.expenses += item.metrics.expenses;
          acc.income += item.metrics.income;
          acc.netCost += item.metrics.netCost;
          acc.clients += item.metrics.clientCount;
          acc.mrr += item.metrics.mrr;
          acc.mrrYear += item.metrics.mrrYear;
          acc.implementation += item.metrics.implementation;
          acc.revenue += item.metrics.revenue;
          acc.roi += item.metrics.roi;
          acc.mqls += item.metrics.mqlsEvolved;
          return acc;
        },
        {
          expenses: 0,
          income: 0,
          netCost: 0,
          clients: 0,
          mrr: 0,
          mrrYear: 0,
          implementation: 0,
          revenue: 0,
          roi: 0,
          mqls: 0,
        },
      ),
    [summaries],
  );

  const chartData = summaries.map(({ bundle, metrics }) => ({
    name: bundle.name.replace(/^Café\s+/i, ""),
    roi: Number(metrics.roi.toFixed(2)),
  }));

  const selected = yearBundles.find((bundle) => bundle.id === selectedId) ?? null;

  const remove = useMutation({
    mutationFn: deleteRoiEvent,
    onSuccess: async () => {
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["roi"] });
      toast.success("Evento removido do ROI");
    },
    onError: () => toast.error("Não foi possível remover o evento do ROI."),
  });

  function openCreate() {
    setEditingBundle(null);
    setEditorOpen(true);
  }

  function openEdit(bundle: RoiEventBundle) {
    setEditingBundle(bundle);
    setEditorOpen(true);
  }

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10 lg:py-12">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="label-caps mb-2">Performance de eventos</p>
          <h1 className="font-display text-3xl font-medium tracking-tight lg:text-4xl">
            ROI dos Eventos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Visão executiva separada da alimentação dos dados para facilitar análises e apresentações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setManagement((current) => !current)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              management
                ? "border border-input bg-canvas text-foreground hover:bg-muted"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {management ? <ArrowLeft className="size-4" /> : <Database className="size-4" />}
            {management ? "Voltar para visão" : "Gerenciar dados"}
          </button>
        </div>
      </header>

      <div className="mb-8 flex gap-2 border-b border-border">
        {([
          ["cafe", "Café Prevision"],
          ["sponsored", "Eventos patrocinados"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setKind(value);
              setSelectedId(null);
            }}
            className={cn(
              "relative px-1 pb-4 pr-6 text-sm font-semibold transition-colors",
              kind === value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {kind === value ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />
            ) : null}
          </button>
        ))}
      </div>

      {bundlesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados de ROI...</p>
      ) : bundlesQuery.isError ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os dados de ROI.</p>
          <button
            onClick={() => void bundlesQuery.refetch()}
            className="mt-3 text-xs font-semibold text-accent hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : management ? (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-medium">Alimentação de dados</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edite entradas, saídas e resultados sem poluir a visão executiva.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="size-4" />
              {kind === "cafe" ? "Adicionar Café" : "Adicionar evento ao ROI"}
            </button>
          </div>

          {yearBundles.length === 0 ? (
            <EmptyState management />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-canvas">
              <div className="hidden grid-cols-[1fr_130px_140px_140px_90px] gap-4 border-b border-border px-5 py-3 md:grid">
                <span className="label-caps">Evento</span>
                <span className="label-caps">Custo líquido</span>
                <span className="label-caps">Receita</span>
                <span className="label-caps">ROI</span>
                <span className="label-caps text-right">Ações</span>
              </div>
              {summaries.map(({ bundle, metrics }) => (
                <div
                  key={bundle.id}
                  className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[1fr_130px_140px_140px_90px] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold">{bundle.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRoiDate(bundle.event_date)}
                    </p>
                  </div>
                  <span className="text-sm">{formatMoney(metrics.netCost)}</span>
                  <span className="text-sm">{formatMoney(metrics.revenue)}</span>
                  <span className={cn("text-sm font-semibold", metrics.roi >= 0 ? "text-confirm" : "text-destructive")}>
                    {formatMoney(metrics.roi)}
                  </span>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(bundle)}
                      aria-label={`Editar ${bundle.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remover “${bundle.name}” do ROI? Os dados financeiros e comerciais vinculados também serão removidos.`)) {
                          remove.mutate(bundle.id);
                        }
                      }}
                      aria-label={`Remover ${bundle.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : yearBundles.length === 0 ? (
        <EmptyState management={false} />
      ) : (
        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="ROI acumulado"
              value={formatMoney(totals.roi)}
              helper={`${yearBundles.length} evento${yearBundles.length === 1 ? "" : "s"} no período`}
            />
            <SummaryCard
              label="Custo líquido"
              value={formatMoney(totals.netCost)}
              helper={`Saídas ${formatMoney(totals.expenses)} · Entradas ${formatMoney(totals.income)}`}
            />
            <SummaryCard
              label="Receita gerada"
              value={formatMoney(totals.revenue)}
              helper={`MRR Ano ${formatMoney(totals.mrrYear)} + implantação ${formatMoney(totals.implementation)}`}
            />
            <SummaryCard
              label={kind === "cafe" ? "Novos clientes" : "MQLs que evoluíram"}
              value={String(kind === "cafe" ? totals.clients : totals.mqls)}
              helper={
                kind === "cafe"
                  ? `MRR mensal gerado: ${formatMoney(totals.mrr)}`
                  : `${totals.clients} novo${totals.clients === 1 ? "" : "s"} cliente${totals.clients === 1 ? "" : "s"}`
              }
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="rounded-xl border border-border bg-canvas p-5">
              <div className="mb-5">
                <p className="label-caps">Comparativo</p>
                <h2 className="mt-1 font-display text-lg font-medium">ROI por evento</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 20 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={chartData.length > 5 ? -25 : 0}
                      textAnchor={chartData.length > 5 ? "end" : "middle"}
                      height={chartData.length > 5 ? 60 : 35}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        Math.abs(Number(value)) >= 1000
                          ? `${Math.round(Number(value) / 1000)}k`
                          : String(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => [formatMoney(Number(value)), "ROI"]}
                      cursor={{ fill: "var(--muted)" }}
                    />
                    <Bar dataKey="roi" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-canvas p-5">
              <p className="label-caps">Visão comercial</p>
              <h2 className="mt-1 font-display text-lg font-medium">Resultados do período</h2>
              <div className="mt-6 space-y-5">
                <div className="flex items-end justify-between border-b border-border pb-4">
                  <span className="text-sm text-muted-foreground">MRR mensal gerado</span>
                  <strong>{formatMoney(totals.mrr)}</strong>
                </div>
                <div className="flex items-end justify-between border-b border-border pb-4">
                  <span className="text-sm text-muted-foreground">MRR Ano</span>
                  <strong>{formatMoney(totals.mrrYear)}</strong>
                </div>
                <div className="flex items-end justify-between border-b border-border pb-4">
                  <span className="text-sm text-muted-foreground">Implantação</span>
                  <strong>{formatMoney(totals.implementation)}</strong>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">Novos clientes</span>
                  <strong>{totals.clients}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-canvas">
            <div className="border-b border-border px-5 py-4">
              <p className="label-caps">Eventos</p>
              <h2 className="mt-1 font-display text-lg font-medium">Resultado por edição</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-foreground/[0.02]">
                    <th className="px-5 py-3 label-caps">Evento</th>
                    <th className="px-4 py-3 label-caps">Data</th>
                    <th className="px-4 py-3 label-caps">Custo líquido</th>
                    {kind === "sponsored" ? (
                      <th className="px-4 py-3 label-caps">MQLs</th>
                    ) : null}
                    <th className="px-4 py-3 label-caps">Clientes</th>
                    <th className="px-4 py-3 label-caps">MRR</th>
                    <th className="px-4 py-3 label-caps">MRR Ano</th>
                    <th className="px-4 py-3 label-caps">Implantação</th>
                    <th className="px-4 py-3 label-caps">ROI</th>
                    <th className="px-4 py-3 label-caps">ROI %</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(({ bundle, metrics }) => (
                    <tr
                      key={bundle.id}
                      className={cn(
                        "cursor-pointer border-b border-border last:border-b-0 hover:bg-foreground/[0.02]",
                        selectedId === bundle.id && "bg-foreground/[0.03]",
                      )}
                      onClick={() => setSelectedId((current) => (current === bundle.id ? null : bundle.id))}
                    >
                      <td className="px-5 py-4 text-sm font-semibold">{bundle.name}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {formatRoiDate(bundle.event_date)}
                      </td>
                      <td className="px-4 py-4 text-sm">{formatMoney(metrics.netCost)}</td>
                      {kind === "sponsored" ? (
                        <td className="px-4 py-4 text-sm">{metrics.mqlsEvolved}</td>
                      ) : null}
                      <td className="px-4 py-4 text-sm">{metrics.clientCount}</td>
                      <td className="px-4 py-4 text-sm">{formatMoney(metrics.mrr)}</td>
                      <td className="px-4 py-4 text-sm">{formatMoney(metrics.mrrYear)}</td>
                      <td className="px-4 py-4 text-sm">{formatMoney(metrics.implementation)}</td>
                      <td className={cn("px-4 py-4 text-sm font-semibold", metrics.roi >= 0 ? "text-confirm" : "text-destructive")}>
                        {formatMoney(metrics.roi)}
                      </td>
                      <td className="px-4 py-4 text-sm">{formatPercent(metrics.roiPercent)}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            selectedId === bundle.id && "rotate-180",
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected ? <EventDetail bundle={selected} /> : null}
        </div>
      )}

      <RoiEventDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        kind={kind}
        bundle={editingBundle}
        sponsoredOptions={sponsoredOptionsQuery.data ?? []}
      />
    </section>
  );
}
