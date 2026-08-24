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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      const base = toForm(event);
      setForm({ ...base, event_date: base.event_date || defaultDate || "" });
    }
  }, [open, event, defaultDate]);

  const mutation = useMutation({
    mutationFn: async () => {
      const raw = form.investment_value.replace(/\./g, "").replace(",", ".").trim();
      const payload = {
        name: form.name.trim(),
        event_date: form.event_date,
        location: form.location.trim() || null,
        status: form.status,
        investment_value: raw ? Number(raw) : null,
        important_link: form.important_link.trim() || null,
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
            mutation.mutate();
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
                value={form.investment_value}
                onChange={(e) => setForm({ ...form, investment_value: e.target.value })}
              />
            </div>
            <div>
              <label className="label-caps mb-1 block">Link importante</label>
              <input
                className={inputClass}
                placeholder="https://"
                value={form.important_link}
                onChange={(e) => setForm({ ...form, important_link: e.target.value })}
              />
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
