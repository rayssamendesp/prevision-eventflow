import type { RoiEventBundle } from "@/lib/roi";

type HistoricCafe = {
  name: string;
  totalExpenses: number;
  items: Record<string, number>;
};

const CAFE_COSTS_2025: HistoricCafe[] = [
  { name: "Café POA", totalExpenses: 11406, items: { "Locação de espaço": 300, "Coffee Break": 2690, "Fotografia": 4200, "Brindes público": 1762, "Brindes painelistas": 454, "Logística do time": 2000 } },
  { name: "Café Florianópolis", totalExpenses: 11282, items: { "Locação de espaço": 4000, "Fotografia": 1600, "Brindes público": 1762, "Brindes painelistas": 520, "Logística do time": 2000, "Sonorização / iluminação": 1400 } },
  { name: "Café Curitiba", totalExpenses: 4282, items: { "Brindes público": 1762, "Brindes painelistas": 520, "Logística do time": 2000 } },
  { name: "Café Bim+Lean", totalExpenses: 12303.93, items: { "Fotografia": 3500, "Brindes público": 1762, "Brindes painelistas": 1041.93, "Logística do time": 6000 } },
  { name: "Café Londrina", totalExpenses: 11369, items: { "Locação de espaço": 6100, "Fotografia": 800, "Brindes público": 881, "Brindes painelistas": 588, "Logística do time": 3000 } },
  { name: "Café Caxias do Sul", totalExpenses: 13510.44, items: { "Locação de espaço": 5081, "Fotografia": 4948.44, "Brindes público": 881, "Brindes painelistas": 600, "Logística do time": 2000 } },
  { name: "Café Belém", totalExpenses: 14883, items: { "Locação de espaço": 6202, "Fotografia": 5300, "Brindes público": 881, "Brindes painelistas": 500, "Logística do time": 2000 } },
  { name: "Café Santo André", totalExpenses: 15188, items: { "Locação de espaço": 6647, "Fotografia": 5000, "Brindes público": 881, "Brindes painelistas": 660, "Logística do time": 2000 } },
  { name: "Café Goiânia", totalExpenses: 10891.5, items: { "Locação de espaço": 6385.5, "Fotografia": 1185, "Brindes público": 881, "Brindes painelistas": 440, "Logística do time": 2000 } },
  { name: "Café Sorocaba", totalExpenses: 15138.09, items: { "Locação de espaço": 6014, "Fotografia": 5800, "Brindes público": 881, "Brindes painelistas": 443.09, "Logística do time": 2000 } },
  { name: "Café Rio de Janeiro", totalExpenses: 10937, items: { "Locação de espaço": 2250, "Coffee Break": 2900, "Fotografia": 2500, "Brindes público": 881, "Brindes painelistas": 406, "Logística do time": 2000 } },
  { name: "Café Ribeirão", totalExpenses: 15660.08, items: { "Locação de espaço": 6521.08, "Fotografia": 5850, "Brindes público": 881, "Brindes painelistas": 408, "Logística do time": 2000 } },
];

const ITEM_ORDER = [
  "Locação de espaço",
  "Coffee Break",
  "Fotografia",
  "Brindes público",
  "Brindes painelistas",
  "Sonorização / iluminação",
  "Logística do time (comparável)",
  "Passagens aéreas",
  "Hospedagem",
  "Diárias",
  "Transporte local",
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeExpenseCategory(category: string) {
  const value = fold(category);
  if (value.includes("espaco") || value.includes("sala")) return "Locação de espaço";
  if (value.includes("coffee")) return "Coffee Break";
  if (value.includes("fotograf")) return "Fotografia";
  if (value.includes("painel") && value.includes("brind")) return "Brindes painelistas";
  if (value.includes("brind")) return "Brindes público";
  if (value.includes("sonoriz") || value.includes("ilumin")) return "Sonorização / iluminação";
  if (value.includes("aereo") || value.includes("passagem")) return "Passagens aéreas";
  if (value.includes("hotel") || value.includes("hosped")) return "Hospedagem";
  if (value.includes("diaria")) return "Diárias";
  if (value.includes("uber") || value.includes("transporte")) return "Transporte local";
  if (value.includes("logistica")) return "Logística do time";
  return category.trim();
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function valuesFor2025(item: string) {
  const source = item === "Logística do time (comparável)" ? "Logística do time" : item;
  return CAFE_COSTS_2025
    .map((cafe) => Number(cafe.items[source] || 0))
    .filter((value) => value > 0);
}

function build2026Events(cafeBundles: RoiEventBundle[]) {
  return cafeBundles
    .filter((bundle) => !bundle.event_date || Number(bundle.event_date.slice(0, 4)) === 2026)
    .map((bundle) => {
      const items: Record<string, number> = {};
      bundle.financialEntries
        .filter((entry) => entry.direction === "expense" && Number(entry.amount) > 0)
        .forEach((entry) => {
          const category = normalizeExpenseCategory(entry.category);
          items[category] = (items[category] || 0) + Number(entry.amount);
        });

      const totalExpenses = Object.values(items).reduce((sum, value) => sum + value, 0);
      return { name: bundle.name, totalExpenses, items };
    })
    .filter((event) => event.totalExpenses > 0);
}

function valuesFor2026(
  item: string,
  events: ReturnType<typeof build2026Events>,
) {
  if (item === "Logística do time (comparável)") {
    return events
      .map((event) =>
        ["Logística do time", "Passagens aéreas", "Hospedagem", "Diárias", "Transporte local"]
          .reduce((sum, category) => sum + Number(event.items[category] || 0), 0),
      )
      .filter((value) => value > 0);
  }

  return events
    .map((event) => Number(event.items[item] || 0))
    .filter((value) => value > 0);
}

export function buildCafeCostAnalysis(cafeBundles: RoiEventBundle[]) {
  const events2026 = build2026Events(cafeBundles);
  const extra2026Items = Array.from(
    new Set(events2026.flatMap((event) => Object.keys(event.items))),
  ).filter(
    (item) =>
      !ITEM_ORDER.includes(item) &&
      item !== "Logística do time",
  );

  const items = [...ITEM_ORDER, ...extra2026Items].map((item) => {
    const values2025 = valuesFor2025(item);
    const values2026 = valuesFor2026(item, events2026);
    const combined = [...values2025, ...values2026];

    return {
      item,
      count2025: values2025.length,
      average2025: average(values2025),
      count2026: values2026.length,
      average2026: average(values2026),
      countCombined: combined.length,
      averageCombined: average(combined),
      minCombined: combined.length ? Math.min(...combined) : null,
      maxCombined: combined.length ? Math.max(...combined) : null,
    };
  }).filter((row) => row.countCombined > 0);

  const unit2025 = CAFE_COSTS_2025.map((cafe) => cafe.totalExpenses).filter((value) => value > 0);
  const unit2026 = events2026.map((event) => event.totalExpenses).filter((value) => value > 0);
  const unitCombined = [...unit2025, ...unit2026];

  return {
    source2025: "RÓI CAFÉ PREVISION - 2025.xlsx",
    source2026: "ROI 2026 da plataforma",
    methodology:
      "Médias por item consideram apenas valores maiores que zero. O custo médio unitário usa as saídas brutas de cada Café, antes de patrocínios e demais entradas.",
    logisticsNote:
      "Em 2025, a planilha registra viagem e deslocamento como “Logística time”, sem separar passagem, hotel, diária e transporte. Por isso, esses subitens usam somente registros em que aparecem individualizados; a linha “Logística do time (comparável)” soma os componentes de 2026 para permitir comparação com o valor agregado de 2025.",
    unitCost: {
      count2025: unit2025.length,
      average2025: average(unit2025),
      count2026: unit2026.length,
      average2026: average(unit2026),
      countCombined: unitCombined.length,
      averageCombined: average(unitCombined),
      total2025: unit2025.reduce((sum, value) => sum + value, 0),
      total2026: unit2026.reduce((sum, value) => sum + value, 0),
    },
    items,
  };
}
