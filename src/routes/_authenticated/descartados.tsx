import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvents, formatShortDate, parseDate } from "@/lib/events";

export const Route = createFileRoute("/_authenticated/descartados")({
  head: () => ({
    meta: [
      { title: "Eventos descartados | Gestão de Eventos Prevision" },
      {
        name: "description",
        content:
          "Eventos externos arquivados pela equipe da Prevision, com histórico preservado e opção de restaurar.",
      },
      { property: "og:title", content: "Eventos descartados | Gestão de Eventos Prevision" },
      {
        property: "og:description",
        content: "Eventos arquivados pela Prevision com opção de restaurar.",
      },
    ],
  }),
  component: DescartadosPage,
});

function DescartadosPage() {
  const queryClient = useQueryClient();
  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["events", "archived"],
    queryFn: () => fetchEvents(true),
  });

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").update({ archived: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Evento restaurado");
    },
    onError: () => toast.error("Não foi possível restaurar o evento."),
  });

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10 lg:py-12">
      <header className="mb-10">
        <h1 className="mb-2 font-display text-3xl font-medium leading-tight lg:text-4xl">
          Eventos descartados
        </h1>
        <p className="text-sm text-muted-foreground">
          Eventos que a Prevision decidiu não participar. Nada foi apagado.
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : isError ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-10 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os eventos descartados.</p>
          <button
            onClick={() => void refetch()}
            className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-foreground/[0.02] p-10 text-center">
          <p className="label-caps">Nenhum evento descartado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl bg-canvas p-6 opacity-80 ring-1 ring-border">
              <div className="mb-6 flex items-start justify-between gap-3">
                <StatusBadge status={event.status} />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatShortDate(event.event_date)} · {parseDate(event.event_date).getFullYear()}
                </span>
              </div>
              <h2 className="mb-2 font-display text-lg font-medium leading-tight">{event.name}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{event.location || "—"}</p>
              <button
                onClick={() => restore.mutate(event.id)}
                className="text-[11px] font-semibold uppercase tracking-widest text-accent hover:underline"
              >
                Restaurar evento
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
