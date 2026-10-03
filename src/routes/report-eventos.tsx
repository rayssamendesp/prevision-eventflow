import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getPublishedReportUrl } from "@/lib/roi-report-publish";

export const Route = createFileRoute("/report-eventos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Report de Eventos | Prevision" },
      {
        name: "description",
        content: "Report de resultados dos eventos Prevision.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublishedEventReport,
});

function PublishedEventReport() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function renderReport() {
      try {
        const publicUrl = getPublishedReportUrl();
        const separator = publicUrl.includes("?") ? "&" : "?";
        const response = await fetch(
          `${publicUrl}${separator}v=${Date.now()}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        if (!active) return;

        document.open();
        document.write(html);
        document.close();
      } catch (cause) {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : "Erro desconhecido";
        console.error("[Report] Falha ao carregar HTML publicado:", cause);
        setError(message);
      }
    }

    void renderReport();
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="max-w-md text-center">
          <p className="label-caps">Report de Eventos</p>
          <h1 className="mt-3 font-display text-2xl font-medium">
            Não foi possível carregar o report
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            O arquivo publicado não pôde ser carregado. Erro: {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0C0C0C] px-6 text-white">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2F78FF]">
          Prevision · Report de Eventos
        </p>
        <p className="mt-4 text-sm text-white/55">Carregando report...</p>
      </div>
    </main>
  );
}
