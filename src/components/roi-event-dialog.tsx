import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateRoiMetrics,
  formatMoney,
  monthsRemainingInYear,
  type RoiEventBundle,
  type RoiKind,
  type SponsoredEventOption,
} from "@/lib/roi";

const inputClass =
  "w-full rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

type FinancialInput = {
  key: string;
  category: string;
  description: string;
  amount: string;
};

type SaleInput = {
  key: string;
  client_name: string;
  client_count: string;
  close_date: string;
  mrr: string;
  mrr_year_override: string;
  implementation: string;
};

function makeKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function toInputNumber(value: number | null | undefined) {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

function parseNumber(value: string) {
  const raw = value.trim().replace(/\s/g, "");
  if (!raw) return 0;
  const normalized =
    raw.includes(",") && raw.includes(".")
      ? raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "")
      : raw.includes(",")
        ? raw.replace(",", ".")
        : raw;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function initialFinancial(
  bundle: RoiEventBundle | null | undefined,
  direction: "expense" | "income",
): FinancialInput[] {
  const entries =
    bundle?.financialEntries.filter((entry) => entry.direction === direction) ?? [];
  if (entries.length === 0) return [];
  return entries.map((entry) => ({
    key: entry.id,
    category: entry.category,
    description: entry.description ?? "",
    amount: toInputNumber(Number(entry.amount)),
  }));
}

function initialSales(bundle: RoiEventBundle | null | undefined): SaleInput[] {
  return (bundle?.sales ?? []).map((sale) => ({
    key: sale.id,
    client_name: sale.client_name ?? "",
    client_count: String(sale.client_count || 1),
    close_date: sale.close_date ?? "",
    mrr: toInputNumber(Number(sale.mrr)),
    mrr_year_override:
      sale.mrr_year_override == null ? "" : toInputNumber(Number(sale.mrr_year_override)),
    implementation: toInputNumber(Number(sale.implementation)),
  }));
}

function blankFinancial(category = ""): FinancialInput {
  return { key: makeKey(), category, description: "", amount: "" };
}

function blankSale(): SaleInput {
  return {
    key: makeKey(),
    client_name: "",
    client_count: "1",
    close_date: "",
    mrr: "",
    mrr_year_override: "",
    implementation: "",
  };
}

export function RoiEventDialog({
  open,
  onOpenChange,
  kind,
  bundle,
  sponsoredOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: RoiKind;
  bundle?: RoiEventBundle | null;
  sponsoredOptions: SponsoredEventOption[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [sponsoredEventId, setSponsoredEventId] = useState("");
  const [mqls, setMqls] = useState("0");
  const [notes, setNotes] = useState("");
  const [expenses, setExpenses] = useState<FinancialInput[]>([]);
  const [income, setIncome] = useState<FinancialInput[]>([]);
  const [sales, setSales] = useState<SaleInput[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(bundle?.name ?? "");
    setEventDate(bundle?.event_date ?? "");
    setSponsoredEventId(bundle?.sponsored_event_id ?? "");
    setMqls(String(bundle?.mqls_evolved ?? 0));
    setNotes(bundle?.notes ?? "");
    setExpenses(initialFinancial(bundle, "expense"));
    setIncome(initialFinancial(bundle, "income"));
    setSales(initialSales(bundle));
  }, [open, bundle]);

  const preview = useMemo(() => {
    const fakeBundle: RoiEventBundle = {
      id: bundle?.id ?? "preview",
      kind,
      sponsored_event_id: sponsoredEventId || null,
      name,
      event_date: eventDate || null,
      mqls_evolved: Math.max(0, Math.round(parseNumber(mqls))),
      notes: notes || null,
      created_at: bundle?.created_at ?? "",
      updated_at: bundle?.updated_at ?? "",
      financialEntries: [
        ...expenses.map((entry) => ({
          id: entry.key,
          roi_event_id: bundle?.id ?? "preview",
          direction: "expense" as const,
          category: entry.category,
          description: entry.description || null,
          amount: parseNumber(entry.amount),
          created_at: "",
        })),
        ...income.map((entry) => ({
          id: entry.key,
          roi_event_id: bundle?.id ?? "preview",
          direction: "income" as const,
          category: entry.category,
          description: entry.description || null,
          amount: parseNumber(entry.amount),
          created_at: "",
        })),
      ],
      sales: sales.map((sale) => ({
        id: sale.key,
        roi_event_id: bundle?.id ?? "preview",
        client_name: sale.client_name || null,
        client_count: Math.max(1, Math.round(parseNumber(sale.client_count) || 1)),
        close_date: sale.close_date || null,
        mrr: parseNumber(sale.mrr),
        mrr_year_override: sale.mrr_year_override
          ? parseNumber(sale.mrr_year_override)
          : null,
        implementation: parseNumber(sale.implementation),
        created_at: "",
      })),
    };
    return calculateRoiMetrics(fakeBundle);
  }, [bundle, eventDate, expenses, income, kind, mqls, name, notes, sales, sponsoredEventId]);

  const save = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("name_required");

      const eventPayload = {
        kind,
        sponsored_event_id: kind === "sponsored" ? sponsoredEventId || null : null,
        name: trimmedName,
        event_date: eventDate || null,
        mqls_evolved: kind === "sponsored" ? Math.max(0, Math.round(parseNumber(mqls))) : 0,
        notes: notes.trim() || null,
      };

      let eventId = bundle?.id ?? null;

      if (eventId) {
        const { error } = await supabase.from("roi_events").update(eventPayload).eq("id", eventId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("roi_events")
          .insert(eventPayload)
          .select("id")
          .single();
        if (error) throw error;
        eventId = data.id;
      }

      const [financialDelete, salesDelete] = await Promise.all([
        supabase.from("roi_financial_entries").delete().eq("roi_event_id", eventId),
        supabase.from("roi_sales").delete().eq("roi_event_id", eventId),
      ]);
      if (financialDelete.error) throw financialDelete.error;
      if (salesDelete.error) throw salesDelete.error;

      const financialRows = [
        ...expenses
          .filter((entry) => entry.category.trim() && parseNumber(entry.amount) > 0)
          .map((entry) => ({
            roi_event_id: eventId,
            direction: "expense" as const,
            category: entry.category.trim(),
            description: entry.description.trim() || null,
            amount: parseNumber(entry.amount),
          })),
        ...income
          .filter((entry) => entry.category.trim() && parseNumber(entry.amount) > 0)
          .map((entry) => ({
            roi_event_id: eventId,
            direction: "income" as const,
            category: entry.category.trim(),
            description: entry.description.trim() || null,
            amount: parseNumber(entry.amount),
          })),
      ];

      if (financialRows.length > 0) {
        const { error } = await supabase.from("roi_financial_entries").insert(financialRows);
        if (error) throw error;
      }

      const saleRows = sales
        .filter(
          (sale) =>
            sale.client_name.trim() ||
            parseNumber(sale.mrr) > 0 ||
            parseNumber(sale.implementation) > 0,
        )
        .map((sale) => ({
          roi_event_id: eventId,
          client_name: sale.client_name.trim() || null,
          client_count: Math.max(1, Math.round(parseNumber(sale.client_count) || 1)),
          close_date: sale.close_date || null,
          mrr: parseNumber(sale.mrr),
          mrr_year_override: sale.mrr_year_override
            ? parseNumber(sale.mrr_year_override)
            : null,
          implementation: parseNumber(sale.implementation),
        }));

      if (saleRows.length > 0) {
        const { error } = await supabase.from("roi_sales").insert(saleRows);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roi"] });
      toast.success(bundle ? "Dados do ROI atualizados" : "Evento adicionado ao ROI");
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "name_required") {
        toast.error("Informe o nome do evento.");
        return;
      }
      toast.error("Não foi possível salvar os dados de ROI.");
    },
  });

  function updateExpense(key: string, patch: Partial<FinancialInput>) {
    setExpenses((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  function updateIncome(key: string, patch: Partial<FinancialInput>) {
    setIncome((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  function updateSale(key: string, patch: Partial<SaleInput>) {
    setSales((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto bg-canvas">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">
            {bundle ? "Editar dados de ROI" : kind === "cafe" ? "Adicionar Café" : "Adicionar evento ao ROI"}
          </DialogTitle>
          <DialogDescription>
            Preencha apenas os dados de origem. Totais, MRR Ano e ROI são calculados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <details open className="rounded-lg border border-border bg-foreground/[0.015]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              Informações do evento
            </summary>
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
              {kind === "sponsored" ? (
                <div className="sm:col-span-2">
                  <label className="label-caps mb-1 block">Vincular a evento patrocinado</label>
                  <select
                    className={inputClass}
                    value={sponsoredEventId}
                    onChange={(event) => {
                      const id = event.target.value;
                      setSponsoredEventId(id);
                      const selected = sponsoredOptions.find((option) => option.id === id);
                      if (!selected) return;
                      setName(selected.name);
                      setEventDate(selected.event_date ?? "");
                      if (
                        selected.investment_value &&
                        expenses.length === 0
                      ) {
                        setExpenses([
                          {
                            ...blankFinancial("Patrocínio"),
                            amount: toInputNumber(selected.investment_value),
                          },
                        ]);
                      }
                    }}
                  >
                    <option value="">Não vincular / preencher manualmente</option>
                    {sponsoredOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="label-caps mb-1 block">Nome</label>
                <input
                  className={inputClass}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div>
                <label className="label-caps mb-1 block">Data</label>
                <input
                  className={inputClass}
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </div>
              {kind === "sponsored" ? (
                <div>
                  <label className="label-caps mb-1 block">MQLs que evoluíram no funil</label>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={mqls}
                    onChange={(event) => setMqls(event.target.value)}
                  />
                </div>
              ) : null}
              <div className={kind === "cafe" ? "sm:col-span-2" : ""}>
                <label className="label-caps mb-1 block">Observações internas</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-border bg-foreground/[0.015]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              Saídas do evento
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {formatMoney(preview.expenses)}
              </span>
            </summary>
            <div className="space-y-3 border-t border-border p-4">
              {expenses.map((entry) => (
                <div key={entry.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_32px]">
                  <input
                    className={inputClass}
                    placeholder="Ex.: Fotógrafo"
                    value={entry.category}
                    onChange={(event) => updateExpense(entry.key, { category: event.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Descrição opcional"
                    value={entry.description}
                    onChange={(event) =>
                      updateExpense(entry.key, { description: event.target.value })
                    }
                  />
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={entry.amount}
                    onChange={(event) => updateExpense(entry.key, { amount: event.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remover saída"
                    onClick={() =>
                      setExpenses((current) => current.filter((item) => item.key !== entry.key))
                    }
                    className="flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExpenses((current) => [...current, blankFinancial()])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Plus className="size-3.5" /> Adicionar saída
              </button>
            </div>
          </details>

          <details className="rounded-lg border border-border bg-foreground/[0.015]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              Entradas do evento
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {formatMoney(preview.income)}
              </span>
            </summary>
            <div className="space-y-3 border-t border-border p-4">
              {income.map((entry) => (
                <div key={entry.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_32px]">
                  <input
                    className={inputClass}
                    placeholder="Ex.: Patrocínio"
                    value={entry.category}
                    onChange={(event) => updateIncome(entry.key, { category: event.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Empresa / descrição"
                    value={entry.description}
                    onChange={(event) => updateIncome(entry.key, { description: event.target.value })}
                  />
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={entry.amount}
                    onChange={(event) => updateIncome(entry.key, { amount: event.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remover entrada"
                    onClick={() =>
                      setIncome((current) => current.filter((item) => item.key !== entry.key))
                    }
                    className="flex items-center justify-center text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIncome((current) => [...current, blankFinancial("Patrocínio")])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Plus className="size-3.5" /> Adicionar entrada
              </button>
            </div>
          </details>

          <details className="rounded-lg border border-border bg-foreground/[0.015]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              Resultados comerciais
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {preview.clientCount} cliente{preview.clientCount === 1 ? "" : "s"} · MRR {formatMoney(preview.mrr)}
              </span>
            </summary>
            <div className="space-y-4 border-t border-border p-4">
              {sales.map((sale) => {
                const calculatedYear =
                  !sale.mrr_year_override && sale.close_date
                    ? parseNumber(sale.mrr) * monthsRemainingInYear(sale.close_date)
                    : null;
                return (
                  <div key={sale.key} className="rounded-md border border-border bg-canvas p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Cliente / venda</p>
                      <button
                        type="button"
                        aria-label="Remover venda"
                        onClick={() =>
                          setSales((current) => current.filter((item) => item.key !== sale.key))
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <label className="label-caps mb-1 block">Cliente</label>
                        <input
                          className={inputClass}
                          placeholder="Nome da conta"
                          value={sale.client_name}
                          onChange={(event) =>
                            updateSale(sale.key, { client_name: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-caps mb-1 block">Qtd. clientes</label>
                        <input
                          className={inputClass}
                          inputMode="numeric"
                          value={sale.client_count}
                          onChange={(event) =>
                            updateSale(sale.key, { client_count: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-caps mb-1 block">Data da venda / início</label>
                        <input
                          className={inputClass}
                          type="date"
                          value={sale.close_date}
                          onChange={(event) =>
                            updateSale(sale.key, { close_date: event.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-caps mb-1 block">MRR mensal</label>
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          placeholder="0,00"
                          value={sale.mrr}
                          onChange={(event) => updateSale(sale.key, { mrr: event.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label-caps mb-1 block">Implantação</label>
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          placeholder="0,00"
                          value={sale.implementation}
                          onChange={(event) =>
                            updateSale(sale.key, { implementation: event.target.value })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="label-caps mb-1 block">MRR Ano manual (opcional)</label>
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          placeholder={
                            calculatedYear != null
                              ? `Calculado: ${formatMoney(calculatedYear)}`
                              : "Deixe vazio para calcular pela data da venda"
                          }
                          value={sale.mrr_year_override}
                          onChange={(event) =>
                            updateSale(sale.key, { mrr_year_override: event.target.value })
                          }
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Para novas vendas, deixe vazio: o sistema multiplica o MRR pelos meses restantes do ano.
                          O campo manual preserva consolidados históricos quando a data individual não existe.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setSales((current) => [...current, blankSale()])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <Plus className="size-3.5" /> Adicionar cliente / venda
              </button>
            </div>
          </details>

          <div className="rounded-lg bg-primary px-4 py-4 text-primary-foreground">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">Custo líquido</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(preview.netCost)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">MRR Ano</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(preview.mrrYear)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">Implantação</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(preview.implementation)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-70">ROI</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(preview.roi)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {save.isPending ? "Salvando..." : "Salvar dados"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
