import { CAFE_ANALYSIS_2026 } from "@/lib/cafe-analysis-data";
import { calculateRoiMetrics, type RoiEventBundle } from "@/lib/roi";

type HistoricalCafe = {
  year: 2025;
  location: string | null;
  region: string | null;
  label: string;
  mqls: number;
  clients: number;
  mrr: number;
  sponsorship: number;
};

const CAFE_2025: HistoricalCafe[] = [
  { year: 2025, location: "Porto Alegre", region: "Sul", label: "Café POA", mqls: 14, clients: 1, mrr: 2298, sponsorship: 9800 },
  { year: 2025, location: "Florianópolis", region: "Sul", label: "Café Florianópolis", mqls: 6, clients: 2, mrr: 7148, sponsorship: 0 },
  { year: 2025, location: "Curitiba", region: "Sul", label: "Café Curitiba", mqls: 14, clients: 1, mrr: 1399, sponsorship: 0 },
  { year: 2025, location: null, region: null, label: "Café Bim + Lean", mqls: 33, clients: 2, mrr: 3949, sponsorship: 11000 },
  { year: 2025, location: "Londrina", region: "Sul", label: "Café Londrina", mqls: 10, clients: 0, mrr: 0, sponsorship: 10990 },
  { year: 2025, location: "Caxias do Sul", region: "Sul", label: "Café Caxias do Sul", mqls: 9, clients: 0, mrr: 0, sponsorship: 10990 },
  { year: 2025, location: "Belém", region: "Norte", label: "Café Belém", mqls: 8, clients: 0, mrr: 0, sponsorship: 5000 },
  { year: 2025, location: "Santo André", region: "Sudeste", label: "Café Santo André", mqls: 7, clients: 1, mrr: 2398, sponsorship: 10000 },
  { year: 2025, location: "Goiânia", region: "Centro-Oeste", label: "Café Goiânia", mqls: 6, clients: 1, mrr: 1598, sponsorship: 14000 },
  { year: 2025, location: "Sorocaba", region: "Sudeste", label: "Café Sorocaba", mqls: 5, clients: 0, mrr: 0, sponsorship: 0 },
  { year: 2025, location: "Rio de Janeiro", region: "Sudeste", label: "Café Rio de Janeiro", mqls: 4, clients: 1, mrr: 3774, sponsorship: 5000 },
  { year: 2025, location: "Ribeirão", region: "Sudeste", label: "Café Ribeirão", mqls: 3, clients: 1, mrr: 3396, sponsorship: 5000 },
];

const REGION_BY_LOCATION: Record<string, string> = {
  Campinas: "Sudeste",
  Fortaleza: "Nordeste",
  Vitória: "Sudeste",
  Cascavel: "Sul",
  "João Pessoa": "Nordeste",
  Aracaju: "Nordeste",
  Curitiba: "Sul",
  Salvador: "Nordeste",
  Uberlândia: "Sudeste",
  "São José do Rio Preto": "Sudeste",
  Florianópolis: "Sul",
  Manaus: "Norte",
  "Porto Alegre": "Sul",
  Joinville: "Sul",
};

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanCafeName(value: string) {
  return value
    .replace(/^Café\s+Prevision\s+/i, "")
    .replace(/^Café\s+/i, "")
    .trim();
}

function normalizeLocation(value: string) {
  const clean = cleanCafeName(value);
  const aliases: Record<string, string> = {
    poa: "Porto Alegre",
    "sao jose do rio preto": "São José do Rio Preto",
    florianopolis: "Florianópolis",
    vitoria: "Vitória",
    uberlandia: "Uberlândia",
    "joao pessoa": "João Pessoa",
  };
  return aliases[fold(clean)] || clean;
}

function sponsorshipOf(bundle: RoiEventBundle) {
  return bundle.financialEntries
    .filter((entry) => {
      if (entry.direction !== "income") return false;
      return fold(entry.category).includes("patrocin");
    })
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function mqlMap2026() {
  return new Map(
    CAFE_ANALYSIS_2026.cafes.map((row) => [fold(String(row[0])), Number(row[1])]),
  );
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(total: number, count: number) {
  return count ? total / count : 0;
}

export function buildCafeReturnAnalysis(cafeBundles: RoiEventBundle[]) {
  const mqls2026 = mqlMap2026();
  const cafes2026 = cafeBundles
    .filter((bundle) => !bundle.event_date || Number(bundle.event_date.slice(0, 4)) === 2026)
    .map((bundle) => {
      const location = normalizeLocation(bundle.name);
      const metrics = calculateRoiMetrics(bundle);
      return {
        year: 2026 as const,
        location,
        region: REGION_BY_LOCATION[location] || "Região não classificada",
        label: bundle.name,
        mqls: Number(mqls2026.get(fold(location)) || 0),
        clients: Number(metrics.clientCount || 0),
        mrr: Number(metrics.mrr || 0),
        sponsorship: sponsorshipOf(bundle),
      };
    });

  const allEditions = [...CAFE_2025, ...cafes2026];
  const geolocatedEditions = allEditions.filter((item) => item.location && item.region);
  const excludedGeographic = allEditions
    .filter((item) => !item.location || !item.region)
    .map((item) => item.label);

  const locationMap = new Map<string, {
    location: string;
    region: string;
    editions: number;
    years: Set<number>;
    mqlTotal: number;
    clients: number;
    mrrTotal: number;
    sponsorshipTotal: number;
  }>();

  geolocatedEditions.forEach((edition) => {
    const key = edition.location!;
    const current = locationMap.get(key) || {
      location: key,
      region: edition.region!,
      editions: 0,
      years: new Set<number>(),
      mqlTotal: 0,
      clients: 0,
      mrrTotal: 0,
      sponsorshipTotal: 0,
    };
    current.editions += 1;
    current.years.add(edition.year);
    current.mqlTotal += edition.mqls;
    current.clients += edition.clients;
    current.mrrTotal += edition.mrr;
    current.sponsorshipTotal += edition.sponsorship;
    locationMap.set(key, current);
  });

  const locationsBase = Array.from(locationMap.values()).map((item) => ({
    location: item.location,
    region: item.region,
    editions: item.editions,
    years: Array.from(item.years).sort(),
    mqlTotal: item.mqlTotal,
    mqlPerEdition: average(item.mqlTotal, item.editions),
    clients: item.clients,
    mrrTotal: item.mrrTotal,
    mrrPerEdition: average(item.mrrTotal, item.editions),
    sponsorshipTotal: item.sponsorshipTotal,
    sponsorshipPerEdition: average(item.sponsorshipTotal, item.editions),
  }));

  const maxMql = Math.max(...locationsBase.map((item) => item.mqlPerEdition), 1);
  const maxMrr = Math.max(...locationsBase.map((item) => item.mrrPerEdition), 1);
  const maxSponsor = Math.max(...locationsBase.map((item) => item.sponsorshipPerEdition), 1);

  const totalSponsorshipAll = allEditions.reduce((sum, item) => sum + item.sponsorship, 0);
  const sponsoredEditionsAll = allEditions.filter((item) => item.sponsorship > 0);
  const totalSponsorship2025 = CAFE_2025.reduce((sum, item) => sum + item.sponsorship, 0);
  const sponsored2025 = CAFE_2025.filter((item) => item.sponsorship > 0);
  const totalSponsorship2026 = cafes2026.reduce((sum, item) => sum + item.sponsorship, 0);
  const sponsored2026 = cafes2026.filter((item) => item.sponsorship > 0);
  const sponsorshipOverallAverage = average(totalSponsorshipAll, allEditions.length);

  const locations = locationsBase
    .map((item) => {
      const score =
        40 * (item.mqlPerEdition / maxMql) +
        40 * (item.mrrPerEdition / maxMrr) +
        20 * (item.sponsorshipPerEdition / maxSponsor);
      const signals: string[] = [];
      if (item.years.length > 1) signals.push("Praça recorrente");
      if (item.mrrTotal > 0) signals.push("Venda atribuída");
      if (item.mqlPerEdition >= 15) signals.push("Demanda alta");
      if (item.sponsorshipPerEdition >= sponsorshipOverallAverage) {
        signals.push("Patrocínio acima da média");
      }
      return { ...item, score: round(score), signals };
    })
    .sort((a, b) => b.score - a.score);

  const regionMap = new Map<string, {
    region: string;
    editions: number;
    mqlTotal: number;
    clients: number;
    mrrTotal: number;
    sponsorshipTotal: number;
  }>();

  geolocatedEditions.forEach((edition) => {
    const key = edition.region!;
    const current = regionMap.get(key) || {
      region: key,
      editions: 0,
      mqlTotal: 0,
      clients: 0,
      mrrTotal: 0,
      sponsorshipTotal: 0,
    };
    current.editions += 1;
    current.mqlTotal += edition.mqls;
    current.clients += edition.clients;
    current.mrrTotal += edition.mrr;
    current.sponsorshipTotal += edition.sponsorship;
    regionMap.set(key, current);
  });

  const regions = Array.from(regionMap.values())
    .map((item) => ({
      ...item,
      mqlPerEdition: average(item.mqlTotal, item.editions),
      mrrPerEdition: average(item.mrrTotal, item.editions),
      sponsorshipPerEdition: average(item.sponsorshipTotal, item.editions),
    }))
    .sort((a, b) => b.mqlPerEdition - a.mqlPerEdition);

  const geolocatedMqls = geolocatedEditions.reduce((sum, item) => sum + item.mqls, 0);
  const geolocatedMrr = geolocatedEditions.reduce((sum, item) => sum + item.mrr, 0);
  const geolocatedClients = geolocatedEditions.reduce((sum, item) => sum + item.clients, 0);

  return {
    source2025: "RÓI CAFÉ PREVISION - 2025.xlsx",
    source2026: "ROI 2026 da plataforma + base comercial de MQLs 2026",
    summary: {
      editionsAll: allEditions.length,
      geolocatedEditions: geolocatedEditions.length,
      geolocatedMqls,
      geolocatedMrr,
      geolocatedClients,
      sponsorshipTotal: totalSponsorshipAll,
      sponsorshipAverageAll: sponsorshipOverallAverage,
      sponsorshipAverageSponsoredOnly: average(
        totalSponsorshipAll,
        sponsoredEditionsAll.length,
      ),
      sponsorshipAverage2025: average(totalSponsorship2025, CAFE_2025.length),
      sponsorshipAverage2026: average(totalSponsorship2026, cafes2026.length),
      sponsorshipSponsoredCount: sponsoredEditionsAll.length,
    },
    weights: {
      mqls: 40,
      mrr: 40,
      sponsorship: 20,
    },
    locations,
    regions,
    recurringLocations: locations.filter((item) => item.years.length > 1),
    excludedGeographic,
    methodology: [
      "O índice de revisita é comparativo e não substitui o ROI. Ele pondera MQLs por edição (40%), MRR/NMRR por edição (40%) e patrocínio médio por edição (20%), normalizando cada indicador pelo maior valor observado entre as praças.",
      "Em 2025, a planilha usa a métrica “MQLs que evoluíram no funil”; em 2026, a análise usa os MQLs da base comercial dos Cafés. Por isso, o cruzamento entre anos deve ser lido como sinal histórico, não como uma série perfeitamente homogênea.",
      "Para receita recorrente, 2025 utiliza NMRR e 2026 utiliza MRR. Os dois valores são reunidos como receita mensal recorrente atribuída ao Café, preservando a identificação da fonte em metodologia.",
      "Patrocínio médio por Café inclui edições sem patrocínio como valor zero. A média entre somente edições patrocinadas é mostrada separadamente.",
      "O Café Bim + Lean de 2025 não possui praça identificada na planilha fornecida e, por isso, fica fora dos rankings geográficos, embora permaneça na média geral de patrocínio.",
    ],
  };
}
