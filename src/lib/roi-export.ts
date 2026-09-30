import { calculateRoiMetrics, saleMrrYear, type RoiEventBundle, type RoiKind } from "@/lib/roi";
import { CLIENT_SCRIPT, STYLES } from "@/lib/roi-export-template";

/**
 * Builds a self-contained, read-only snapshot of the ROI dashboard.
 * No credentials, Supabase connection, database IDs or external assets are exported.
 */
export function generateRoiHtml(
  cafeBundles: RoiEventBundle[],
  sponsoredBundles: RoiEventBundle[],
  initialKind: RoiKind,
  initialYear: number,
): string {
  function pack(bundles: RoiEventBundle[]) {
    return bundles.map((bundle, index) => {
      const m = calculateRoiMetrics(bundle);
      return {
        key: bundle.kind + "-" + index,
        name: bundle.name,
        event_date: bundle.event_date,
        mqls_evolved: bundle.mqls_evolved,
        notes: bundle.notes,
        financialEntries: bundle.financialEntries.map((entry) => ({
          direction: entry.direction,
          category: entry.category,
          description: entry.description,
          amount: Number(entry.amount),
        })),
        sales: bundle.sales.map((sale) => ({
          client_name: sale.client_name,
          client_count: Number(sale.client_count),
          close_date: sale.close_date,
          mrr: Number(sale.mrr),
          mrrYear: saleMrrYear(sale),
          implementation: Number(sale.implementation),
        })),
        metrics: { ...m, clients: m.clientCount, mqls: m.mqlsEvolved },
      };
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    initialKind,
    initialYear,
    cafe: pack(cafeBundles),
    sponsored: pack(sponsoredBundles),
  };

  // Prevent event descriptions or names from breaking out of the JSON script tag.
  const json = JSON.stringify(payload).replace(/[<>&\u2028\u2029]/g, (ch) =>
    "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );

  return HTML_BEFORE + STYLES + HTML_AFTER_CSS + json + HTML_AFTER_JSON + CLIENT_SCRIPT + HTML_END;
}

const HTML_BEFORE = "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>ROI dos Eventos | Prevision</title>\n<meta name=\"description\" content=\"Relatório de ROI dos eventos Prevision, exportado na data indicada.\">\n<style>";
const HTML_AFTER_CSS = "</style></head>\n<body>\n<div class=\"layout\">\n  <aside class=\"sidebar\">\n    <div class=\"brand\"><div class=\"brand-top\"><span class=\"logo-square\"></span>Prevision</div><div class=\"caps\">Gestão de Eventos</div></div>\n    <div class=\"nav\"><button class=\"active\" type=\"button\"><span class=\"nav-dot\"></span>ROI dos eventos</button></div>\n    <div class=\"sidebar-foot\">Relatório exportado<br><span id=\"stamp\"></span><br>Visualização sem conexão.</div>\n  </aside>\n  <div class=\"main\"><div class=\"container\">\n    <header class=\"page-head\">\n      <div><div class=\"caps\">Performance de eventos</div><h1>ROI dos Eventos</h1>\n      <p class=\"intro\">Visão executiva do Café Prevision e dos eventos patrocinados. Fotografia dos dados na data da exportação.</p></div>\n      <div class=\"toolbar\"><label class=\"visually-hidden\" for=\"year\">Ano</label><select id=\"year\" aria-label=\"Filtrar ano\"></select>\n      <button class=\"pill\" id=\"print\" type=\"button\">Imprimir / PDF</button></div>\n    </header>\n    <nav class=\"tabs\" aria-label=\"Tipo de evento\">\n      <button type=\"button\" data-kind=\"cafe\">Café Prevision</button>\n      <button type=\"button\" data-kind=\"sponsored\">Eventos patrocinados</button>\n    </nav>\n    <div id=\"empty\" class=\"empty\" hidden>Nenhum dado de ROI neste período. Selecione outro ano.</div>\n    <main id=\"report\" role=\"main\">\n      <section class=\"kpis\" id=\"summary\" aria-label=\"Indicadores de ROI\"></section>\n      <section class=\"middle\">\n        <article class=\"card\"><div class=\"caps\">Comparativo</div><h2>ROI por evento</h2><div class=\"chart-scroll\" id=\"chart\"></div></article>\n        <article class=\"card\"><div class=\"caps\">Visão comercial</div><h2>Resultados do período</h2><div class=\"results\" id=\"results\"></div></article>\n      </section>\n      <section class=\"table-card\">\n        <div class=\"table-title\"><div class=\"caps\">Eventos</div><h2>Resultado por edição</h2>\n          <p class=\"subtle\" style=\"margin:8px 0 0\">Clique em um evento para visualizar entradas, saídas e vendas vinculadas.</p></div>\n        <div class=\"table-scroll\" id=\"table-host\"></div>\n      </section>\n    </main>\n    <section id=\"detail\" class=\"card detail\" aria-label=\"Detalhamento do evento\" hidden></section>\n    <footer class=\"method\"><div class=\"caps\">Metodologia do relatório</div>\n      <p>Custo líquido = saídas − entradas de patrocínios. Receita gerada = MRR Ano + implantação.\n      ROI acumulado = soma da receita gerada − soma do custo líquido dos eventos filtrados.</p>\n      <p>MRR Ano = MRR mensal × meses restantes no ano, incluindo o mês de fechamento; registros históricos podem ter o MRR Ano informado manualmente.\n      ROI % = ROI ÷ custo líquido × 100. Se o custo líquido for negativo (patrocínio superior ao gasto), a porcentagem deixa de ser adequada para comparação; priorize os valores em reais.</p>\n      <p>Os resultados representam os registros atribuídos aos eventos até a data da exportação, não uma consulta em tempo real.</p>\n    </footer>\n  </div></div>\n</div>\n<script id=\"roi-data\" type=\"application/json\">";
const HTML_AFTER_JSON = "</script>\n<script>";
const HTML_END = "</script>\n</body></html>";

/** Trigger the download directly after querying the up-to-date ROI records. */
export function downloadRoiHtml(
  cafeBundles: RoiEventBundle[],
  sponsoredBundles: RoiEventBundle[],
  initialKind: RoiKind,
  initialYear: number,
) {
  const html = generateRoiHtml(cafeBundles, sponsoredBundles, initialKind, initialYear);
  const blob = new Blob(["\uFEFF", html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "roi-prevision-" + new Date().toISOString().slice(0, 10) + ".html";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}
