-- Normalize legacy task relationships without deleting task records.
UPDATE public.tasks AS child
SET parent_task_id = NULL
WHERE child.parent_task_id IS NOT NULL
  AND (
    child.parent_task_id = child.id
    OR NOT EXISTS (
      SELECT 1
      FROM public.tasks AS parent
      WHERE parent.id = child.parent_task_id
        AND parent.event_id = child.event_id
        AND parent.parent_task_id IS NULL
    )
  );

-- A task cannot be both a subtask and a parent. Promote middle-level nodes.
UPDATE public.tasks AS node
SET parent_task_id = NULL
WHERE node.parent_task_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tasks AS child
    WHERE child.parent_task_id = node.id
  );

CREATE OR REPLACE FUNCTION public.validate_task_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_event_id UUID;
  parent_parent_task_id UUID;
BEGIN
  -- A parent task with children cannot be moved to another event independently.
  IF EXISTS (
    SELECT 1
    FROM public.tasks AS child
    WHERE child.parent_task_id = NEW.id
      AND child.event_id <> NEW.event_id
  ) THEN
    RAISE EXCEPTION 'Uma tarefa com subtarefas deve permanecer no mesmo evento das subtarefas.';
  END IF;

  IF NEW.parent_task_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_task_id = NEW.id THEN
    RAISE EXCEPTION 'Uma tarefa não pode ser subtarefa dela mesma.';
  END IF;

  SELECT parent.event_id, parent.parent_task_id
    INTO parent_event_id, parent_parent_task_id
  FROM public.tasks AS parent
  WHERE parent.id = NEW.parent_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A tarefa principal selecionada não existe.';
  END IF;

  IF parent_event_id <> NEW.event_id THEN
    RAISE EXCEPTION 'Tarefa principal e subtarefa devem pertencer ao mesmo evento.';
  END IF;

  IF parent_parent_task_id IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido criar subtarefa de subtarefa.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.tasks AS child
    WHERE child.parent_task_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Uma tarefa que possui subtarefas não pode virar subtarefa.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_validate_hierarchy ON public.tasks;
CREATE TRIGGER tasks_validate_hierarchy
BEFORE INSERT OR UPDATE OF event_id, parent_task_id ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.validate_task_hierarchy();

-- Events are archived/restored through the archived flag, never hard-deleted by authenticated users.
DROP POLICY IF EXISTS "events_all_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_select_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_update_authenticated" ON public.events;

REVOKE DELETE ON public.events FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.events TO authenticated;

CREATE POLICY "events_select_authenticated"
ON public.events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "events_insert_authenticated"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "events_update_authenticated"
ON public.events
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Record the authenticated creator automatically and keep authorship immutable.
ALTER TABLE public.events
ALTER COLUMN created_by SET DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION public.enforce_event_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.created_by := auth.uid();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_by := OLD.created_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_enforce_created_by ON public.events;
CREATE TRIGGER events_enforce_created_by
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.enforce_event_created_by();
