import { supabase } from "@/integrations/supabase/client";
import { fetchRoiBundles } from "@/lib/roi";
import { generateRoiHtml } from "@/lib/roi-export";

export const REPORT_BUCKET = "event-reports";
export const REPORT_PATH = "report-eventos-prevision.html";

const FACTUAL_TEXT_REPLACEMENTS: Array<[string, string]> = [
  [
    "Prevision · Event Report",
    "Prevision · Report de Eventos",
  ],
  [
    "Uma leitura rápida do volume de eventos e dos sinais mais importantes do período. O Café Prevision é o foco principal; os eventos patrocinados entram como uma camada complementar de aquisição e evolução comercial.",
    "Uma leitura do volume de eventos e dos indicadores registrados no período. A visão reúne Café Prevision e eventos patrocinados em seções separadas.",
  ],
  [
    "O principal ativo de <strong>relacionamento.</strong>",
    "Café Prevision em <strong>números.</strong>",
  ],
  [
    "Presença externa. <strong>Sinais comerciais.</strong>",
    "Eventos patrocinados em <strong>números.</strong>",
  ],
  [
    "Uma visão mais objetiva: investimento, MQLs que evoluíram, vendas atribuídas, receita e ROI dos eventos patrocinados.",
    "A seção apresenta investimento, MQLs que evoluíram, vendas atribuídas, receita e ROI dos eventos patrocinados.",
  ],
  [
    "O report é uma fotografia dos dados no momento da exportação. Atualizações feitas posteriormente na plataforma aparecem na próxima exportação.",
    "O report apresenta os dados publicados a partir da plataforma. Cada atualização publicada substitui a versão anterior no mesmo link.",
  ],
  [
    "Quando o custo líquido é negativo, o ROI percentual deixa de ser adequado para comparação. Nesses casos, priorize a leitura dos valores absolutos em reais.",
    "Quando o custo líquido é negativo, a divisão do ROI pelo custo líquido produz percentual negativo; o valor em reais permanece disponível separadamente no report.",
  ],
];

function keepReportTextFactual(html: string) {
  return FACTUAL_TEXT_REPLACEMENTS.reduce(
    (current, [from, to]) => current.split(from).join(to),
    html,
  );
}

export function getPublishedReportUrl() {
  return supabase.storage.from(REPORT_BUCKET).getPublicUrl(REPORT_PATH).data.publicUrl;
}

/**
 * Rebuilds the report from the latest saved ROI data and overwrites one fixed
 * public HTML file. The URL never changes between publications.
 */
export async function publishRoiReport(initialYear = new Date().getFullYear()) {
  const [cafes, sponsored] = await Promise.all([
    fetchRoiBundles("cafe"),
    fetchRoiBundles("sponsored"),
  ]);

  const html = keepReportTextFactual(
    generateRoiHtml(cafes, sponsored, "cafe", initialYear),
  );
  const body = new Blob(["\uFEFF", html], { type: "text/html;charset=utf-8" });

  const { error } = await supabase.storage.from(REPORT_BUCKET).upload(REPORT_PATH, body, {
    upsert: true,
    contentType: "text/html;charset=utf-8",
    cacheControl: "0",
  });
  if (error) throw error;

  return getPublishedReportUrl();
}
