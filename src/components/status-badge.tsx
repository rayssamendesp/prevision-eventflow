import { STATUS_LABEL, type EventStatus } from "@/lib/events";
import { cn } from "@/lib/utils";

const STYLES: Record<EventStatus, string> = {
  mapeado: "bg-muted text-muted-foreground border-input",
  em_negociacao: "bg-negotiation/10 text-negotiation-foreground border-negotiation/30",
  confirmado: "bg-confirm/10 text-confirm border-confirm/25",
  realizado: "bg-transparent text-done-foreground border-input",
};

export function StatusBadge({
  status,
  solid = false,
  className,
}: {
  status: EventStatus;
  solid?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-tight",
        solid && status === "confirmado"
          ? "border-confirm bg-confirm text-confirm-foreground"
          : STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
