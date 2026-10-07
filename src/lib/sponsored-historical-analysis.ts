import { calculateRoiMetrics, type RoiEventBundle } from "@/lib/roi";

type HistoricalSponsoredEvent = {
  year: 2025;
  name: string;
  family: string;
  cost: number;
  mqls: number;
  clients: number;
  mrr: number;
  mrrYear: number;
  implementation: number;
  roi: number;
};

const SPONSORED_2025: HistoricalSponsoredEvent[] = [
  { year: 2025, name: "Imersão Con.tech", family: "Contech", cost: 2000, mqls: 18, clients: 1, mrr: 3036, mrrYear: 3036, implementation: 5000, roi: 6036 },
  { year: 2025, name: "InMeta Conecta", family: "InMeta", cost: 5500, mqls: 40, clients: 0, mrr: 0, mrrYear: 0, implementation: 0, roi: -5500 },
  { year: 2025, name: "Desafios da Engenharia", family: "Desafios da Engenharia", cost: 3000, mqls: 6, clients: 0, mrr: 0, mrrYear: 0, implementation: 0, roi: -3000 },
  { year: 2025, name: "Expoconstruir", family: "Expoconstruir", cost: 11000, mqls: 0, clients: 0, mrr: 0, mrrYear: 0, implementation: 0, roi: -11000 },
  { year: 2025, name: "Construir Aí", family: "Construir Aí", cost: 8800, mqls: 27, clients: 1, mrr: 3150, mrrYear: 6300, implementation: 4548, roi: 2048 },
  { year: 2025, name: "CTE Edifícios Altos", family: "CTE Edifícios Altos", cost: 8000, mqls: 0, clients: 0, mrr: 0, mrrYear: 0, implementation: 0, roi: -8000 },
  { year: 2025, name: "Otus Day", family: "Otus Day", cost: 0, mqls: 7, clients: 0, mrr: 0, mrrYear: 0, implementation: 0, roi: 0 },
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sponsoredFamily(name: string) {
  const value = fold(name);
  if (value.includes("contech") || value.includes("con.tech")) return "Contech";
  if (value.includes("inmeta")) return "InMeta";
  if (value.includes("project controls")) return "Project Controls";
  if (value.includes("construsul")) return "Construsul";
  if (value.includes("rm mais")) return "RM Mais";
  if (value.includes("feplan")) return "Feplan · A Diretoria";
  if (value.includes("missao cte")) return "Missão CTE";
  if (value.includes("secovi")) return "Secovi";
  if (value.includes("grua")) return "Workshop Grua";
  if (value.includes("desafios da engenharia")) return "Desafios da Engenharia";
  if (value.includes("expoconstruir")) return "Expoconstruir";
  if (value.includes("construir ai")) return "Construir Aí";
  if (value.includes("edificios altos")) return "CTE Edifícios Altos";
  if (value.includes("otus")) return "Otus Day";
  return name
    .replace(/^Evento\s+/i, "")
    .replace(/\s+\d{2}\.\d{4}$/i, "")
    .replace(/\s+-\s+\d{2}\/\d{2}\/\d{2,4}$/i, "")
    .trim();
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function buildSponsoredHistoricalAnalysis(sponsoredBundles: RoiEventBundle[]) {
  const current = sponsoredBundles
    .filter((bundle) => !bundle.event_date || Number(bundle.event_date.slice(0, 4)) === 2026)
    .map((bundle) => {
      const metrics = calculateRoiMetrics(bundle);
      return {
        year: 2026 as const,
        name: bundle.name,
        family: sponsoredFamily(bundle.name),
        cost: Number(metrics.expenses || 0),
        mqls: Number(metrics.mqlsEvolved || 0),
        clients: Number(metrics.clientCount || 0),
        mrr: Number(metrics.mrr || 0),
        mrrYear: Number(metrics.mrrYear || 0),
        implementation: Number(metrics.implementation || 0),
        roi: Number(metrics.roi || 0),
      };
    });

  const editions = [...SPONSORED_2025, ...current];
  const paid2025 = SPONSORED_2025.filter((event) => event.cost > 0);
  const paid2026 = current.filter((event) => event.cost > 0);
  const paidAll = editions.filter((event) => event.cost > 0);

  const familyMap = new Map<string, {
    family: string;
    editions: number;
    years: Set<number>;
    mqls: number;
    clients: number;
    mrr: number;
    revenue: number;
    cost: number;
    roi: number;
    editionNames: string[];
  }>();

  editions.forEach((event) => {
    const row = familyMap.get(event.family) || {
      family: event.family,
      editions: 0,
      years: new Set<number>(),
      mqls: 0,
      clients: 0,
      mrr: 0,
      revenue: 0,
      cost: 0,
      roi: 0,
      editionNames: [],
    };
    row.editions += 1;
    row.years.add(event.year);
    row.mqls += event.mqls;
    row.clients += event.clients;
    row.mrr += event.mrr;
    row.revenue += event.mrrYear + event.implementation;
    row.cost += event.cost;
    row.roi += event.roi;
    row.editionNames.push(`${event.year} · ${event.name}`);
    familyMap.set(event.family, row);
  });

  const base = Array.from(familyMap.values()).map((row) => ({
    family: row.family,
    editions: row.editions,
    years: Array.from(row.years).sort(),
    mqls: row.mqls,
    mqlsPerEdition: row.mqls / row.editions,
    clients: row.clients,
    mrr: row.mrr,
    mrrPerEdition: row.mrr / row.editions,
    revenue: row.revenue,
    cost: row.cost,
    costPerEdition: row.cost / row.editions,
    costPerMql: row.mqls > 0 ? row.cost / row.mqls : null,
    roi: row.roi,
    editionNames: row.editionNames,
  }));

  const maxMqlPerEdition = Math.max(...base.map((row) => row.mqlsPerEdition), 1);
  const maxMrrPerEdition = Math.max(...base.map((row) => row.mrrPerEdition), 1);
  const finiteCostPerMql = base
    .filter((row) => row.mqls > 0 && row.costPerMql != null && row.costPerMql > 0)
    .map((row) => Number(row.costPerMql));
  const bestPositiveCostPerMql = finiteCostPerMql.length
    ? Math.min(...finiteCostPerMql)
    : 1;

  const families = base
    .map((row) => {
      const demandScore = row.mqlsPerEdition / maxMqlPerEdition;
      const revenueScore = row.mrrPerEdition / maxMrrPerEdition;
      const efficiencyScore =
        row.mqls <= 0
          ? 0
          : row.cost === 0
            ? 1
            : Math.min(1, bestPositiveCostPerMql / Number(row.costPerMql || 1));
      const score = 40 * demandScore + 40 * revenueScore + 20 * efficiencyScore;
      const signals: string[] = [];
      if (row.years.length > 1) signals.push("Histórico em 2025 e 2026");
      if (row.clients > 0) signals.push("Venda atribuída");
      if (row.mqlsPerEdition >= 15) signals.push("Demanda alta");
      if (row.roi > 0) signals.push("ROI histórico positivo");
      if (efficiencyScore >= 0.75 && row.mqls > 0) signals.push("Boa eficiência de custo");
      return {
        ...row,
        score: round(score),
        demandScore: round(demandScore * 100),
        revenueScore: round(revenueScore * 100),
        efficiencyScore: round(efficiencyScore * 100),
        signals,
      };
    })
    .sort((a, b) => b.score - a.score);

  const totalCost = editions.reduce((sum, event) => sum + event.cost, 0);
  const totalMqls = editions.reduce((sum, event) => sum + event.mqls, 0);
  const totalMrr = editions.reduce((sum, event) => sum + event.mrr, 0);
  const totalClients = editions.reduce((sum, event) => sum + event.clients, 0);

  return {
    source2025: "RÓI CAFÉ PREVISION - 2025.xlsx · aba ROI Eventos Patrocinados 2025",
    source2026: "ROI 2026 da plataforma",
    summary: {
      editions: editions.length,
      editions2025: SPONSORED_2025.length,
      editions2026: current.length,
      paidEditions: paidAll.length,
      averagePaidCost: average(paidAll.map((event) => event.cost)),
      averagePaidCost2025: average(paid2025.map((event) => event.cost)),
      averagePaidCost2026: average(paid2026.map((event) => event.cost)),
      averageAllCost: average(editions.map((event) => event.cost)),
      totalCost,
      totalMqls,
      totalMrr,
      totalClients,
      overallCostPerMql: totalMqls > 0 ? totalCost / totalMqls : null,
    },
    weights: {
      mqls: 40,
      recurringRevenue: 40,
      investmentEfficiency: 20,
    },
    families,
    editions,
    methodology: [
      "A média de valor pago considera apenas eventos externos com custo bruto maior que zero. Eventos sem desembolso continuam visíveis no histórico, mas não entram nessa média.",
      "O índice de retorno é comparativo e não substitui o ROI. Ele pondera MQLs por edição (40%), MRR/NMRR mensal por edição (40%) e eficiência do investimento (20%).",
      "A eficiência do investimento usa custo por MQL. Eventos com MQLs e custo zero recebem a maior pontuação de eficiência; eventos sem MQL recebem zero nesse componente.",
      "Em 2025, a fonte utiliza NMRR; em 2026, a plataforma utiliza MRR. Os dois são tratados como receita recorrente mensal atribuída ao evento apenas para comparação histórica.",
      "Contech e InMeta são agrupados por família quando o nome identifica claramente a mesma marca/evento em anos diferentes. Os nomes originais de cada edição permanecem disponíveis no detalhamento.",
      "Os dados de 2026 são lidos da plataforma no momento em que o Report é publicado; a análise não escreve nenhum dado de volta no ROI.",
    ],
  };
}
