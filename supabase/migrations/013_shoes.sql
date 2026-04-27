CREATE TABLE IF NOT EXISTS shoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  start_date date DEFAULT CURRENT_DATE,
  km_limit integer DEFAULT 600,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shoes"
  ON shoes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE runs ADD COLUMN IF NOT EXISTS shoe_id uuid REFERENCES shoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shoes_user ON shoes(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_shoe ON runs(shoe_id);
