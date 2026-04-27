-- supabase/migrations/012_forum_replies.sql
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES public.forum_threads (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all replies"
  ON public.forum_replies FOR SELECT USING (true);

CREATE POLICY "Users can create replies"
  ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON public.forum_replies FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON public.forum_replies (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON public.forum_replies (created_at);
