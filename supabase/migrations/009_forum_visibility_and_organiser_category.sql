ALTER TABLE public.forum_threads
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'forum_threads_visibility_check'
  ) THEN
    ALTER TABLE public.forum_threads
      ADD CONSTRAINT forum_threads_visibility_check
      CHECK (visibility IN ('public', 'network'));
  END IF;
END$$;

UPDATE public.forum_threads
SET visibility = 'public'
WHERE visibility IS NULL;

INSERT INTO public.forum_categories (id, title, description, sort_order)
VALUES (
  'organiser',
  'Organiser un run',
  'Proposez ou rejoignez des runs collectifs près de chez vous',
  6
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;
