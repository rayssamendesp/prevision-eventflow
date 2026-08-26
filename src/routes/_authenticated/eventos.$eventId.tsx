import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { EventChecklist } from "@/components/event-checklist";
import { EventFormDialog } from "@/components/event-form-dialog";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchEvent, formatCurrency, formatLongDate } from "@/lib/events";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/eventos/$eventId")({
  head: () => ({
    meta: [
      { title: "Evento | Gestão de Eventos Externos Prevision" },
      {
        name: "description",
        content: "Informações do evento e checklist de tarefas da equipe Prevision.",
      },
      { property: "og:title", content: "Evento | Gestão de Eventos Externos Prevision" },
      {
        property: "og:description",
        content: "Informações do evento e checklist de tarefas da equipe Prevision.",
      },
    ],
  }),
  component: EventDetailPage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-caps mb-1">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function EventDetailPage() {
  const { eventId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const {
    data: event,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent(eventId),
  });

  const discard = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").update({ archived: true }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Evento movido para descartados");
      router.navigate({ to: "/eventos" });
    },
    onError: () => toast.error("Não foi possível descartar o evento."),
  });

  if (isLoading) {
    return <p className="p-10 text-sm text-muted-foreground">Carregando evento...</p>;
  }

  if (isError) {
    return (
      <div className="p-10">
        <p className="text-sm text-muted-foreground">Não foi possível carregar este evento.</p>
        <button
          onClick={() => void refetch()}
          className="mt-4 text-sm font-medium text-accent hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-10">
        <p className="text-sm text-muted-foreground">Evento não encontrado.</p>
        <Link to="/eventos" className="mt-4 inline-block text-sm text-accent underline">
          Voltar para eventos
        </Link>
      </div>
    );
  }

  const value = formatCurrency(event.investment_value);
  const attendees = event.prevision_attendees ?? [];
  const hasExternalContact = Boolean(
    event.external_contact_name || event.external_contact_email || event.external_contact_phone,
  );
  const contactPhoneHref = event.external_contact_phone
    ? event.external_contact_phone.replace(/[^\d+]/g, "")
    : null;

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10 lg:py-12">
      <Link
        to="/eventos"
        className="mb-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Eventos
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-12">
            <p className="label-caps mb-4">Detalhes do evento</p>
            <h1 className="mb-4 font-display text-3xl font-medium tracking-tight">{event.name}</h1>
            <StatusBadge status={event.status} solid className="mb-8" />

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 border-b border-border pb-6">
                <Field label="Data">
                  {event.event_date ? formatLongDate(event.event_date) : "A confirmar"}
                </Field>
                {event.location ? <Field label="Local">{event.location}</Field> : null}
              </div>

              {hasExternalContact ? (
                <div className="border-b border-border pb-6">
                  <p className="label-caps mb-2">Contato responsável pelo evento</p>
                  {event.external_contact_name ? (
                    <p className="text-sm font-medium">{event.external_contact_name}</p>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-1 text-sm">
                    {event.external_contact_email ? (
                      <a
                        href={`mailto:${event.external_contact_email}`}
                        className="w-fit text-accent underline decoration-accent/20 underline-offset-4"
                      >
                        {event.external_contact_email}
                      </a>
                    ) : null}
                    {event.external_contact_phone && contactPhoneHref ? (
                      <a
                        href={`tel:${contactPhoneHref}`}
                        className="w-fit text-accent underline decoration-accent/20 underline-offset-4"
                      >
                        {event.external_contact_phone}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {value || event.important_link ? (
                <div className="grid grid-cols-2 gap-4 border-b border-border pb-6">
                  {value ? <Field label="Investimento">{value}</Field> : null}
                  {event.important_link ? (
                    <Field label="Link">
                      <a
                        href={event.important_link}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-accent underline decoration-accent/20 underline-offset-4"
                      >
                        Abrir link
                      </a>
                    </Field>
                  ) : null}
                </div>
              ) : null}
              {attendees.length > 0 ? (
                <div className="border-b border-border pb-6">
                  <p className="label-caps mb-2">Representantes da Prevision</p>
                  <div className="flex flex-wrap gap-2">
                    {attendees.map((attendee, index) => (
                      <span
                        key={`${attendee}-${index}`}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {event.notes ? (
                <div className="border-b border-border pb-6">
                  <p className="label-caps mb-1">Observações</p>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{event.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-12 flex items-center gap-4">
              <button
                onClick={() => setEditOpen(true)}
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                Editar
              </button>
              <span className="size-1 rounded-full bg-border" />
              <button
                onClick={() => setDiscardOpen(true)}
                className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <EventChecklist eventId={event.id} />
        </div>
      </div>

      <EventFormDialog open={editOpen} onOpenChange={setEditOpen} event={event} />

      <AlertDialog open={discardOpen} onOpenChange={(open) => !open && setDiscardOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar este evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento sai da visualização mensal, mas todas as informações e tarefas continuam
              salvas e podem ser restauradas em Descartados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => discard.mutate()}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
