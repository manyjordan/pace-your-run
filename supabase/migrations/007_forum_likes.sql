-- Forum thread likes + denormalized count
ALTER TABLE public.forum_threads
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.forum_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_likes_thread_id ON public.forum_likes (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_user_id ON public.forum_likes (user_id);

ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_likes_select_authenticated"
  ON public.forum_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forum_likes_insert_own"
  ON public.forum_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "forum_likes_delete_own"
  ON public.forum_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Replies should be removed when the thread is deleted (author delete)
ALTER TABLE public.forum_replies
  DROP CONSTRAINT IF EXISTS forum_replies_thread_id_fkey;

ALTER TABLE public.forum_replies
  ADD CONSTRAINT forum_replies_thread_id_fkey
  FOREIGN KEY (thread_id) REFERENCES public.forum_threads (id) ON DELETE CASCADE;
