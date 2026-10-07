import { calculateRoiMetrics, fetchRoiBundles, saleMrrYear, type RoiEventBundle, type RoiKind } from "@/lib/roi";
import { supabase } from "@/integrations/supabase/client";
import { CLIENT_SCRIPT, STYLES } from "@/lib/roi-export-template";
import { CAFE_ANALYSIS_2026 } from "@/lib/cafe-analysis-data";
import { buildCafeCostAnalysis } from "@/lib/cafe-cost-analysis";
import { buildCafeReturnAnalysis } from "@/lib/cafe-return-analysis";
import { buildSponsoredHistoricalAnalysis } from "@/lib/sponsored-historical-analysis";

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
    cafeAnalysis: CAFE_ANALYSIS_2026,
    cafeCostAnalysis: buildCafeCostAnalysis(cafeBundles),
    cafeReturnAnalysis: buildCafeReturnAnalysis(cafeBundles),
    sponsoredHistoricalAnalysis: buildSponsoredHistoricalAnalysis(sponsoredBundles),
  };

  // Prevent event descriptions or names from breaking out of the JSON script tag.
  const json = JSON.stringify(payload).replace(/[<>&\u2028\u2029]/g, (ch) =>
    "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"),
  );

  return HTML_BEFORE + STYLES + HTML_AFTER_CSS + json + HTML_AFTER_JSON + CLIENT_SCRIPT + HTML_END;
}

const HTML_BEFORE = "<!doctype html>\n<html lang=\"pt-BR\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Report de Eventos | Prevision</title>\n<meta name=\"description\" content=\"Report executivo de eventos Prevision, com foco em Café Prevision e eventos patrocinados.\">\n<style>";
const HTML_AFTER_CSS = "</style></head>\n<body>\n<header class=\"topbar\">\n  <a class=\"brand\" href=\"#top\" aria-label=\"Prevision Report\"><span class=\"star\" aria-hidden=\"true\"></span><span>Prevision · Report de Eventos</span></a>\n  <nav class=\"nav\" aria-label=\"Navegação do report\">\n    <a href=\"#overview\">Visão geral</a>\n    <a href=\"#costs\">Custos</a>\n    <a href=\"#revisit\">Onde voltar?</a>\n    <a href=\"#cafe\">Café Prevision</a>\n    <a href=\"#sponsored\">Eventos patrocinados</a>\n    <a href=\"#analysis\">Análises</a>\n    <a href=\"#method\">Metodologia</a>\n  </nav>\n  <div class=\"toolbar\">\n    <label for=\"year\" style=\"position:absolute;left:-9999px\">Ano</label>\n    <select id=\"year\" aria-label=\"Filtrar ano\"></select>\n    <button id=\"print\" type=\"button\">Imprimir / PDF</button>\n  </div>\n</header>\n\n<main id=\"top\">\n  <section class=\"hero\">\n    <div class=\"hero-grid\">\n      <div class=\"reveal in\">\n        <div class=\"eyebrow\">Performance · Relacionamento & Expansão</div>\n        <h1>Report de <strong>Eventos.</strong></h1>\n        <p class=\"hero-copy\">Uma leitura visual dos resultados dos eventos Prevision: ROI, receita, custos, evolução comercial e principais sinais do Café Prevision e dos eventos patrocinados.</p>\n      </div>\n      <div class=\"hero-meta reveal in\">\n        <div class=\"item\"><div class=\"label\">Ano analisado</div><div class=\"value\" id=\"hero-year\"></div></div>\n        <div class=\"item\"><div class=\"label\">Cafés Prevision</div><div class=\"value\" id=\"hero-cafes\"></div></div>\n        <div class=\"item\"><div class=\"label\">Eventos patrocinados</div><div class=\"value\" id=\"hero-sponsored\"></div></div>\n      </div>\n    </div>\n    <div class=\"scroll-note\">Scroll to explore ↓</div>\n  </section>\n\n  <section class=\"section light\" id=\"overview\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">01 · Visão geral</div><h2>O ano em <strong>movimento.</strong></h2></div>\n        <p class=\"section-intro\">Uma leitura do volume de eventos e dos indicadores registrados no período. A visão reúne Café Prevision e eventos patrocinados em seções separadas.</p>\n      </div>\n      <div class=\"overview-grid\" id=\"overview-metrics\"></div>\n      <div class=\"insight-strip reveal\"><div class=\"tag\">Leitura</div><p id=\"overview-insight\"></p></div>\n    </div>\n  </section>\n\n  <section class=\"section cost-section\" id=\"costs\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">02 · Custos históricos</div><h2>Quanto custa um <strong>Café Prevision.</strong></h2></div>\n        <p class=\"section-intro\">Leitura histórica das saídas brutas dos Cafés, combinando a base de 2025 com os registros atuais de 2026. Os indicadores principais aparecem em destaque; o detalhamento fica disponível sob demanda.</p>\n      </div>\n      <div id=\"cost-analysis-main\"></div>\n    </div>\n  </section>\n\n  <section class=\"section revisit-section\" id=\"revisit\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">03 · Potencial de revisita</div><h2>Onde faz sentido <strong>voltar.</strong></h2></div>\n        <p class=\"section-intro\">Leitura histórica de 2025 + 2026 para comparar demanda gerada, receita recorrente atribuída e sustentação por patrocínio. O índice é comparativo e serve como apoio ao planejamento de novas praças.</p>\n      </div>\n      <div id=\"revisit-analysis-main\"></div>\n    </div>\n  </section>\n\n  <section class=\"section paper\" id=\"cafe\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">04 · Café Prevision</div><h2>Café Prevision em <strong>números.</strong></h2></div>\n        <p class=\"section-intro\">ROI, sustentabilidade financeira e resultado comercial por edição. Os dados refletem as informações atribuídas aos Cafés até a data desta exportação.</p>\n      </div>\n      <div class=\"metric-row\" id=\"cafe-metrics\"></div>\n      <div class=\"acquisition-block reveal\" id=\"cafe-acquisition\"></div>\n      <div class=\"analysis-grid\">\n        <article class=\"panel reveal\">\n          <div class=\"panel-head\"><div><div class=\"smallcaps\">Comparativo</div><div class=\"panel-title\">ROI por edição</div></div></div>\n          <div class=\"chart-wrap\" id=\"cafe-chart\"></div>\n        </article>\n        <article class=\"panel reveal\">\n          <div class=\"smallcaps\">Visão comercial</div><div class=\"panel-title\">Resultados do período</div>\n          <div class=\"results-list\" id=\"cafe-results\"></div>\n        </article>\n      </div>\n      <div class=\"panel reveal\" style=\"margin-top:18px\">\n        <div class=\"panel-head\"><div><div class=\"smallcaps\">Linha do tempo</div><div class=\"panel-title\">Edições do ano</div></div></div>\n        <div class=\"timeline\" id=\"timeline\"></div>\n      </div>\n      <div class=\"table-shell reveal\">\n        <div class=\"table-tools\"><div><div class=\"smallcaps\">Detalhamento</div><div class=\"table-title\">Resultado por edição</div></div><div class=\"smallcaps\">Clique em uma linha para aprofundar</div></div>\n        <div class=\"table-scroll\" id=\"cafe-table\"></div>\n        <div class=\"detail\" id=\"cafe-detail\" hidden></div>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"section dark\" id=\"sponsored\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">05 · Eventos patrocinados</div><h2>Eventos patrocinados em <strong>números.</strong></h2></div>\n        <p class=\"section-intro\">A seção apresenta investimento, MQLs que evoluíram, vendas atribuídas, receita e ROI dos eventos patrocinados.</p>\n      </div>\n      <div class=\"sponsored-summary\" id=\"sponsored-summary\"></div>\n      <div class=\"insight-strip reveal\" style=\"border-color:rgba(255,255,255,.15)\"><div class=\"tag\">Leitura</div><p id=\"sponsored-insight\"></p></div>\n      <div id=\"sponsored-strategy\"></div>\n      <div class=\"sponsored-cards\" id=\"sponsored-cards\"></div>\n      <div class=\"table-shell reveal\" style=\"border-color:rgba(255,255,255,.15);margin-top:48px\">\n        <div class=\"table-tools\"><div><div class=\"smallcaps\" style=\"color:rgba(255,255,255,.45)\">Eventos</div><div class=\"table-title\">Resultado por ação patrocinada</div></div></div>\n        <div class=\"table-scroll\" id=\"sponsored-table\"></div>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"section light\" id=\"analysis\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">06 · Análises complementares</div><h2>Mais detalhe, <strong>sob demanda.</strong></h2></div>\n        <p class=\"section-intro\">Presença, funil, motivos de perda, negócios abertos, ganhos e DR Inside aparecem em módulos recolhidos. As bases e datas de corte são identificadas dentro de cada análise.</p>\n      </div>\n      <div class=\"analysis-summary\" id=\"analysis-summary\"></div>\n      <div class=\"analysis-accordions\" id=\"analysis-accordions\"></div>\n    </div>\n  </section>\n\n  <section class=\"section light\" id=\"method\">\n    <div class=\"section-inner\">\n      <div class=\"section-head reveal\">\n        <div><div class=\"section-no\">07 · Metodologia</div><h2>Como ler os <strong>números.</strong></h2></div>\n        <p class=\"section-intro\">O report apresenta os dados publicados a partir da plataforma. Cada atualização publicada substitui a versão anterior no mesmo link.</p>\n      </div>\n      <div class=\"method-grid\">\n        <article class=\"method-card reveal\"><div class=\"smallcaps\">Custo líquido</div><h3>Saídas − entradas</h3><p>Patrocínios e demais entradas reduzem o custo efetivo do evento. Valor negativo indica que as entradas superaram as saídas registradas.</p></article>\n        <article class=\"method-card reveal\"><div class=\"smallcaps\">Receita gerada</div><h3>MRR Ano + implantação</h3><p>O MRR Ano considera os meses restantes até dezembro, incluindo o mês do fechamento, salvo quando há valor histórico informado manualmente.</p></article>\n        <article class=\"method-card reveal\"><div class=\"smallcaps\">ROI</div><h3>Receita − custo líquido</h3><p>Quando o custo líquido é negativo, a divisão do ROI pelo custo líquido produz percentual negativo; o valor em reais permanece disponível separadamente no report.</p></article>\n      </div>\n    </div>\n  </section>\n</main>\n\n<footer class=\"footer\"><strong>Prevision · Report de Eventos</strong><span>Exportado em <span id=\"generated\"></span> · Visualização offline</span></footer>\n<script id=\"report-data\" type=\"application/json\">";
const HTML_AFTER_JSON = "</script>\n<script>";
const HTML_END = "</script>\n</body></html>";

export const REPORT_BUCKET = "event-reports";
export const REPORT_PATH = "report-eventos-prevision.html";

export function getPublishedReportUrl() {
  return supabase.storage.from(REPORT_BUCKET).getPublicUrl(REPORT_PATH).data.publicUrl;
}

export async function publishRoiReport(initialYear = new Date().getFullYear()) {
  const [cafes, sponsored] = await Promise.all([
    fetchRoiBundles("cafe"),
    fetchRoiBundles("sponsored"),
  ]);
  const html = generateRoiHtml(cafes, sponsored, "cafe", initialYear);
  const body = new Blob(["\uFEFF", html], { type: "text/html" });
  const { error } = await supabase.storage.from(REPORT_BUCKET).upload(REPORT_PATH, body, {
    upsert: true,
    contentType: "text/html",
    cacheControl: "0",
  });
  if (error) throw error;
  return getPublishedReportUrl();
}
