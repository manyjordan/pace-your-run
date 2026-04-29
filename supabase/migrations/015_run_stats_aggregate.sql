CREATE TABLE IF NOT EXISTS run_stats_lifetime (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_distance_km numeric DEFAULT 0,
  total_duration_seconds bigint DEFAULT 0,
  total_runs integer DEFAULT 0,
  total_elevation_gain numeric DEFAULT 0,
  longest_run_km numeric DEFAULT 0,
  best_pace_sec_per_km numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE run_stats_lifetime ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own lifetime stats" ON run_stats_lifetime;
CREATE POLICY "Users read own lifetime stats"
  ON run_stats_lifetime FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users write own lifetime stats" ON run_stats_lifetime;
CREATE POLICY "Users write own lifetime stats"
  ON run_stats_lifetime FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS run_stats_weekly (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  total_distance_km numeric DEFAULT 0,
  total_duration_seconds integer DEFAULT 0,
  run_count integer DEFAULT 0,
  total_elevation_gain numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE run_stats_weekly ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own weekly stats" ON run_stats_weekly;
CREATE POLICY "Users read own weekly stats"
  ON run_stats_weekly FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users write own weekly stats" ON run_stats_weekly;
CREATE POLICY "Users write own weekly stats"
  ON run_stats_weekly FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_run_stats_weekly_user
  ON run_stats_weekly(user_id, week_start DESC);

CREATE OR REPLACE FUNCTION update_run_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_week_start date;
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_week_start := date_trunc('week', COALESCE(NEW.started_at, OLD.started_at))::date;

  INSERT INTO run_stats_weekly (user_id, week_start, total_distance_km, total_duration_seconds, run_count, total_elevation_gain)
  SELECT
    v_user_id, v_week_start,
    COALESCE(SUM(distance_km), 0),
    COALESCE(SUM(duration_seconds), 0),
    COUNT(*),
    COALESCE(SUM(elevation_gain), 0)
  FROM runs
  WHERE user_id = v_user_id
    AND date_trunc('week', started_at)::date = v_week_start
  ON CONFLICT (user_id, week_start) DO UPDATE SET
    total_distance_km = EXCLUDED.total_distance_km,
    total_duration_seconds = EXCLUDED.total_duration_seconds,
    run_count = EXCLUDED.run_count,
    total_elevation_gain = EXCLUDED.total_elevation_gain,
    updated_at = now();

  INSERT INTO run_stats_lifetime (
    user_id, total_distance_km, total_duration_seconds,
    total_runs, total_elevation_gain, longest_run_km, best_pace_sec_per_km
  )
  SELECT
    v_user_id,
    COALESCE(SUM(distance_km), 0),
    COALESCE(SUM(duration_seconds), 0),
    COUNT(*),
    COALESCE(SUM(elevation_gain), 0),
    COALESCE(MAX(distance_km), 0),
    COALESCE(MIN(
      CASE WHEN distance_km >= 3 AND duration_seconds > 0
      THEN duration_seconds::numeric / distance_km
      ELSE NULL END
    ), 0)
  FROM runs WHERE user_id = v_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_distance_km = EXCLUDED.total_distance_km,
    total_duration_seconds = EXCLUDED.total_duration_seconds,
    total_runs = EXCLUDED.total_runs,
    total_elevation_gain = EXCLUDED.total_elevation_gain,
    longest_run_km = EXCLUDED.longest_run_km,
    best_pace_sec_per_km = EXCLUDED.best_pace_sec_per_km,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_run_stats ON runs;
CREATE TRIGGER trigger_update_run_stats
  AFTER INSERT OR UPDATE OR DELETE ON runs
  FOR EACH ROW EXECUTE FUNCTION update_run_stats();

INSERT INTO run_stats_lifetime (
  user_id, total_distance_km, total_duration_seconds,
  total_runs, total_elevation_gain, longest_run_km, best_pace_sec_per_km
)
SELECT
  user_id,
  COALESCE(SUM(distance_km), 0),
  COALESCE(SUM(duration_seconds), 0),
  COUNT(*),
  COALESCE(SUM(elevation_gain), 0),
  COALESCE(MAX(distance_km), 0),
  COALESCE(MIN(
    CASE WHEN distance_km >= 3 AND duration_seconds > 0
    THEN duration_seconds::numeric / distance_km
    ELSE NULL END
  ), 0)
FROM runs
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_distance_km = EXCLUDED.total_distance_km,
  total_duration_seconds = EXCLUDED.total_duration_seconds,
  total_runs = EXCLUDED.total_runs,
  total_elevation_gain = EXCLUDED.total_elevation_gain,
  longest_run_km = EXCLUDED.longest_run_km,
  best_pace_sec_per_km = EXCLUDED.best_pace_sec_per_km,
  updated_at = now();
