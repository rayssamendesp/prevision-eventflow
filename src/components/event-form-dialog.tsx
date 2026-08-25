import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_OPTIONS, type EventRow, type EventStatus } from "@/lib/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const inputClass =
  "w-full rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

type FormState = {
  name: string;
  event_date: string;
  location: string;
  status: EventStatus;
  investment_value: string;
  important_link: string;
  notes: string;
};

type FormErrors = {
  investment_value?: string;
  important_link?: string;
};

function toForm(event?: EventRow | null): FormState {
  return {
    name: event?.name ?? "",
    event_date: event?.event_date ?? "",
    location: event?.location ?? "",
    status: event?.status ?? "mapeado",
    investment_value: event?.investment_value != null ? String(event.investment_value) : "",
    important_link: event?.important_link ?? "",
    notes: event?.notes ?? "",
  };
}

function parseInvestment(input: string): { value: number | null; error?: string } {
  let cleaned = input.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!cleaned) return { value: null };
  if (!/^\d[\d.,]*$/.test(cleaned)) {
    return { value: null, error: "Informe um valor monetário válido." };
  }

  const comma = cleaned.lastIndexOf(",");
  const dot = cleaned.lastIndexOf(".");

  if (comma !== -1 && dot !== -1) {
    cleaned = comma > dot ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  } else if (comma !== -1) {
    const decimals = cleaned.length - comma - 1;
    if (decimals < 1 || decimals > 2) {
      return { value: null, error: "Informe um valor monetário válido." };
    }
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (dot !== -1) {
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      if (parts.slice(1).every((part) => part.length === 3)) {
        cleaned = parts.join("");
      } else {
        return { value: null, error: "Informe um valor monetário válido." };
      }
    } else {
      const decimals = parts[1]?.length ?? 0;
      if (decimals === 3 && parts[0].length <= 3) {
        cleaned = parts.join("");
      } else if (decimals < 1 || decimals > 2) {
        return { value: null, error: "Informe um valor monetário válido." };
      }
    }
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    return { value: null, error: "Informe um valor monetário válido." };
  }
  return { value };
}

function validateImportantLink(input: string): string | undefined {
  const value = input.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) {
      return "Use um link válido iniciado por http:// ou https://.";
    }
  } catch {
    return "Use um link válido iniciado por http:// ou https://.";
  }

  return undefined;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventRow | null;
  defaultDate?: string;
}) {
  const [form, setForm] = useState<FormState>(toForm(event));
  const [errors, setErrors] = useState<FormErrors>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      const base = toForm(event);
      setForm({ ...base, event_date: base.event_date || defaultDate || "" });
      setErrors({});
    }
  }, [open, event, defaultDate]);

  const mutation = useMutation({
    mutationFn: async ({
      investmentValue,
      importantLink,
    }: {
      investmentValue: number | null;
      importantLink: string | null;
    }) => {
      const payload = {
        name: form.name.trim(),
        event_date: form.event_date,
        location: form.location.trim() || null,
        status: form.status,
        investment_value: investmentValue,
        important_link: importantLink,
        notes: form.notes.trim() || null,
      };
      if (event) {
        const { error } = await supabase.from("events").update(payload).eq("id", event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success(event ? "Evento atualizado" : "Evento criado");
      onOpenChange(false);
    },
    onError: () => toast.error("Não foi possível salvar o evento."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-canvas">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">
            {event ? "Editar evento" : "Novo evento"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Apenas nome, data e status são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const investment = parseInvestment(form.investment_value);
            const linkError = validateImportantLink(form.important_link);
            const nextErrors: FormErrors = {
              investment_value: investment.error,
              important_link: linkError,
            };
            setErrors(nextErrors);
            if (investment.error || linkError) return;

            mutation.mutate({
              investmentValue: investment.value,
              importantLink: form.important_link.trim() || null,
            });
          }}
        >
          <div>
            <label className="label-caps mb-1 block">Nome do evento</label>
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-caps mb-1 block">Data</label>
              <input
                required
                type="date"
                className={inputClass}
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label-caps mb-1 block">Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-caps mb-1 block">Cidade / Local</label>
            <input
              className={inputClass}
              placeholder="Centro de Eventos — Florianópolis/SC"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-caps mb-1 block">Valor do patrocínio</label>
              <input
                className={inputClass}
                placeholder="15000,00"
                inputMode="decimal"
                value={form.investment_value}
                onChange={(e) => {
                  setForm({ ...form, investment_value: e.target.value });
                  if (errors.investment_value) {
                    setErrors((current) => ({ ...current, investment_value: undefined }));
                  }
                }}
              />
              {errors.investment_value ? (
                <p className="mt-1 text-xs text-destructive">{errors.investment_value}</p>
              ) : null}
            </div>
            <div>
              <label className="label-caps mb-1 block">Link importante</label>
              <input
                className={inputClass}
                placeholder="https://"
                inputMode="url"
                value={form.important_link}
                onChange={(e) => {
                  setForm({ ...form, important_link: e.target.value });
                  if (errors.important_link) {
                    setErrors((current) => ({ ...current, important_link: undefined }));
                  }
                }}
              />
              {errors.important_link ? (
                <p className="mt-1 text-xs text-destructive">{errors.important_link}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="label-caps mb-1 block">Observações</label>
            <textarea
              rows={3}
              className={inputClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {mutation.isPending ? "Salvando..." : "Salvar evento"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
