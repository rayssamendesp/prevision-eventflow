-- ROI dos Eventos: estrutura de dados + carga inicial de 2026
-- Mantém a visualização executiva separada da alimentação operacional.

CREATE TABLE IF NOT EXISTS public.roi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('cafe', 'sponsored')),
  sponsored_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  name text NOT NULL,
  event_date date,
  mqls_evolved integer NOT NULL DEFAULT 0 CHECK (mqls_evolved >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roi_financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roi_event_id uuid NOT NULL REFERENCES public.roi_events(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('expense', 'income')),
  category text NOT NULL,
  description text,
  amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roi_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roi_event_id uuid NOT NULL REFERENCES public.roi_events(id) ON DELETE CASCADE,
  client_name text,
  client_count integer NOT NULL DEFAULT 1 CHECK (client_count >= 1),
  close_date date,
  mrr numeric(14,2) NOT NULL DEFAULT 0 CHECK (mrr >= 0),
  mrr_year_override numeric(14,2) CHECK (mrr_year_override IS NULL OR mrr_year_override >= 0),
  implementation numeric(14,2) NOT NULL DEFAULT 0 CHECK (implementation >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roi_events_kind_date_idx
  ON public.roi_events(kind, event_date);

CREATE INDEX IF NOT EXISTS roi_financial_entries_event_idx
  ON public.roi_financial_entries(roi_event_id);

CREATE INDEX IF NOT EXISTS roi_sales_event_idx
  ON public.roi_sales(roi_event_id);

ALTER TABLE public.roi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users manage ROI events" ON public.roi_events;
CREATE POLICY "Authenticated users manage ROI events"
  ON public.roi_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage ROI financial entries" ON public.roi_financial_entries;
CREATE POLICY "Authenticated users manage ROI financial entries"
  ON public.roi_financial_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users manage ROI sales" ON public.roi_sales;
CREATE POLICY "Authenticated users manage ROI sales"
  ON public.roi_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_roi_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roi_events_set_updated_at ON public.roi_events;
CREATE TRIGGER roi_events_set_updated_at
BEFORE UPDATE ON public.roi_events
FOR EACH ROW EXECUTE FUNCTION public.set_roi_updated_at();

-- Carga inicial: Café Prevision 2026
INSERT INTO public.roi_events (id, kind, name, event_date)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'cafe', 'Café Campinas', '2026-02-03'),
  ('11111111-1111-4111-8111-111111111102', 'cafe', 'Café Fortaleza', '2026-03-11'),
  ('11111111-1111-4111-8111-111111111103', 'cafe', 'Café Vitória', '2026-03-24'),
  ('11111111-1111-4111-8111-111111111104', 'cafe', 'Café Cascavel', '2026-04-16'),
  ('11111111-1111-4111-8111-111111111105', 'cafe', 'Café João Pessoa', '2026-04-16'),
  ('11111111-1111-4111-8111-111111111106', 'cafe', 'Café Aracaju', '2026-05-21'),
  ('11111111-1111-4111-8111-111111111107', 'cafe', 'Café Curitiba', '2026-05-29'),
  ('11111111-1111-4111-8111-111111111108', 'cafe', 'Café Salvador', '2026-06-09'),
  ('11111111-1111-4111-8111-111111111109', 'cafe', 'Café Uberlândia', '2026-06-11')
ON CONFLICT (id) DO NOTHING;

-- Saídas do Café (somente valores já existentes na base 2026)
INSERT INTO public.roi_financial_entries (id, roi_event_id, direction, category, amount)
VALUES
  ('31111111-1111-4111-8111-111111110001','11111111-1111-4111-8111-111111111101','expense','Espaço - Sala',9712.50),
  ('31111111-1111-4111-8111-111111110002','11111111-1111-4111-8111-111111111101','expense','Fotógrafo',5000.00),
  ('31111111-1111-4111-8111-111111110003','11111111-1111-4111-8111-111111111101','expense','Brindes público',800.00),
  ('31111111-1111-4111-8111-111111110004','11111111-1111-4111-8111-111111111101','expense','Brinde painelista',507.64),
  ('31111111-1111-4111-8111-111111110005','11111111-1111-4111-8111-111111111101','expense','Aéreo',953.50),
  ('31111111-1111-4111-8111-111111110006','11111111-1111-4111-8111-111111111101','expense','Uber',97.97),

  ('31111111-1111-4111-8111-111111110007','11111111-1111-4111-8111-111111111102','expense','Espaço - Sala',7030.00),
  ('31111111-1111-4111-8111-111111110008','11111111-1111-4111-8111-111111111102','expense','Fotógrafo',5540.00),
  ('31111111-1111-4111-8111-111111110009','11111111-1111-4111-8111-111111111102','expense','Brindes público',800.00),
  ('31111111-1111-4111-8111-111111110010','11111111-1111-4111-8111-111111111102','expense','Brinde painelista',135.00),
  ('31111111-1111-4111-8111-111111110011','11111111-1111-4111-8111-111111111102','expense','Diárias',150.00),
  ('31111111-1111-4111-8111-111111110012','11111111-1111-4111-8111-111111111102','expense','Aéreo',3586.79),

  ('31111111-1111-4111-8111-111111110013','11111111-1111-4111-8111-111111111103','expense','Fotógrafo',3850.00),
  ('31111111-1111-4111-8111-111111110014','11111111-1111-4111-8111-111111111103','expense','Brindes público',800.00),
  ('31111111-1111-4111-8111-111111110015','11111111-1111-4111-8111-111111111103','expense','Brinde painelista',175.50),
  ('31111111-1111-4111-8111-111111110016','11111111-1111-4111-8111-111111111103','expense','Diárias',200.00),
  ('31111111-1111-4111-8111-111111110017','11111111-1111-4111-8111-111111111103','expense','Aéreo',4748.96),

  ('31111111-1111-4111-8111-111111110018','11111111-1111-4111-8111-111111111104','expense','Fotógrafo',4300.00),

  ('31111111-1111-4111-8111-111111110019','11111111-1111-4111-8111-111111111105','expense','Espaço - Sala',1000.00),
  ('31111111-1111-4111-8111-111111110020','11111111-1111-4111-8111-111111111105','expense','Coffee Break',2700.00),
  ('31111111-1111-4111-8111-111111110021','11111111-1111-4111-8111-111111111105','expense','Fotógrafo',2900.00),
  ('31111111-1111-4111-8111-111111110022','11111111-1111-4111-8111-111111111105','expense','Brindes público',800.00),

  ('31111111-1111-4111-8111-111111110023','11111111-1111-4111-8111-111111111106','expense','Espaço - Sala',2500.00),
  ('31111111-1111-4111-8111-111111110024','11111111-1111-4111-8111-111111111106','expense','Coffee Break',4000.00),
  ('31111111-1111-4111-8111-111111110025','11111111-1111-4111-8111-111111111106','expense','Fotógrafo',4883.00),
  ('31111111-1111-4111-8111-111111110026','11111111-1111-4111-8111-111111111106','expense','Brindes público',800.00),
  ('31111111-1111-4111-8111-111111110027','11111111-1111-4111-8111-111111111106','expense','Sonorização/Iluminação',1500.00),
  ('31111111-1111-4111-8111-111111110028','11111111-1111-4111-8111-111111111106','expense','Diárias',650.00),
  ('31111111-1111-4111-8111-111111110029','11111111-1111-4111-8111-111111111106','expense','Aéreo',3781.57),
  ('31111111-1111-4111-8111-111111110030','11111111-1111-4111-8111-111111111106','expense','Hotel',1364.23),

  ('31111111-1111-4111-8111-111111110031','11111111-1111-4111-8111-111111111109','expense','Aéreo',1447.96),
  ('31111111-1111-4111-8111-111111110032','11111111-1111-4111-8111-111111111109','expense','Hotel',481.96)
ON CONFLICT (id) DO NOTHING;

-- Entradas / patrocínios do Café
INSERT INTO public.roi_financial_entries (id, roi_event_id, direction, category, amount)
VALUES
  ('32111111-1111-4111-8111-111111110001','11111111-1111-4111-8111-111111111101','income','Patrocínio',19046.00),
  ('32111111-1111-4111-8111-111111110002','11111111-1111-4111-8111-111111111102','income','Patrocínio',10714.00),
  ('32111111-1111-4111-8111-111111110003','11111111-1111-4111-8111-111111111104','income','Patrocínio',9000.00),
  ('32111111-1111-4111-8111-111111110004','11111111-1111-4111-8111-111111111105','income','Patrocínio',13833.00),
  ('32111111-1111-4111-8111-111111110005','11111111-1111-4111-8111-111111111106','income','Patrocínio',2800.00),
  ('32111111-1111-4111-8111-111111110006','11111111-1111-4111-8111-111111111107','income','Patrocínio',12706.00),
  ('32111111-1111-4111-8111-111111110007','11111111-1111-4111-8111-111111111108','income','Patrocínio',10716.00),
  ('32111111-1111-4111-8111-111111110008','11111111-1111-4111-8111-111111111109','income','Patrocínio',9716.00)
ON CONFLICT (id) DO NOTHING;

-- Resultados comerciais históricos do Café.
-- As contas individuais/datas de fechamento não estavam detalhadas na base enviada;
-- por isso o MRR Ano histórico é preservado como valor consolidado editável.
INSERT INTO public.roi_sales (
  id, roi_event_id, client_name, client_count, close_date, mrr, mrr_year_override, implementation
)
VALUES
  ('41111111-1111-4111-8111-111111110001','11111111-1111-4111-8111-111111111103','2 clientes — consolidado da planilha',2,NULL,3698.00,29584.00,8000.00),
  ('41111111-1111-4111-8111-111111110002','11111111-1111-4111-8111-111111111104','Cliente — consolidado da planilha',1,NULL,2000.00,14000.00,4000.00)
ON CONFLICT (id) DO NOTHING;

-- Eventos patrocinados 2026
INSERT INTO public.roi_events (id, kind, sponsored_event_id, name, event_date, mqls_evolved)
VALUES
  (
    '21111111-1111-4111-8111-111111111101',
    'sponsored',
    (SELECT id FROM public.events WHERE lower(name) = lower('Workshop Grua') LIMIT 1),
    'Workshop Grua',
    '2026-03-05',
    21
  ),
  (
    '21111111-1111-4111-8111-111111111102',
    'sponsored',
    (SELECT id FROM public.events WHERE lower(name) = lower('Project Controls') LIMIT 1),
    'Project Controls',
    '2026-04-14',
    3
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.roi_financial_entries (id, roi_event_id, direction, category, amount)
VALUES
  ('33111111-1111-4111-8111-111111110001','21111111-1111-4111-8111-111111111101','expense','Patrocínio',6300.00),
  ('33111111-1111-4111-8111-111111110002','21111111-1111-4111-8111-111111111102','expense','Patrocínio',5213.90),
  ('33111111-1111-4111-8111-111111110003','21111111-1111-4111-8111-111111111102','expense','TV - à parte',400.00),
  ('33111111-1111-4111-8111-111111110004','21111111-1111-4111-8111-111111111102','expense','Internet - à parte',1782.00)
ON CONFLICT (id) DO NOTHING;
