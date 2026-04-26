-- sort_order: ordenação no Kanban por etapa. Backfill a partir de created_at; default para novos INSERTs sem valor.
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION;

UPDATE public.leads
SET sort_order = EXTRACT(EPOCH FROM created_at) * 1000
WHERE sort_order IS NULL;

ALTER TABLE public.leads
ALTER COLUMN sort_order SET DEFAULT (EXTRACT(EPOCH FROM clock_timestamp()) * 1000);

ALTER TABLE public.leads
ALTER COLUMN sort_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_stage_sort_order
ON public.leads(stage_id, sort_order);
