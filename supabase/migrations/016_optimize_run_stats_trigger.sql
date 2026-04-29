-- Incremental run_stats updates: recompute weekly buckets only for affected ISO weeks,
-- and apply O(1) lifetime deltas on INSERT. DELETE/UPDATE refresh longest_run_km and
-- best_pace_sec_per_km from remaining runs (bounded to one user; avoids wrong max/min
-- after removing or editing a dominant row).

CREATE OR REPLACE FUNCTION update_run_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_week_start date;
  v_old_week_start date;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_old_week_start := NULL;

  IF TG_OP = 'DELETE' THEN
    v_week_start := date_trunc('week', OLD.started_at)::date;
  ELSIF TG_OP = 'UPDATE' AND (
    date_trunc('week', OLD.started_at)::date IS DISTINCT FROM date_trunc('week', NEW.started_at)::date
  ) THEN
    v_week_start := date_trunc('week', NEW.started_at)::date;
    v_old_week_start := date_trunc('week', OLD.started_at)::date;
  ELSE
    v_week_start := date_trunc('week', COALESCE(NEW.started_at, OLD.started_at))::date;
  END IF;

  INSERT INTO run_stats_weekly (user_id, week_start, total_distance_km, total_duration_seconds, run_count, total_elevation_gain)
  SELECT
    v_user_id, v_week_start,
    COALESCE(SUM(distance_km), 0),
    COALESCE(SUM(duration_seconds), 0)::integer,
    COUNT(*)::integer,
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

  IF v_old_week_start IS NOT NULL AND v_old_week_start IS DISTINCT FROM v_week_start THEN
    INSERT INTO run_stats_weekly (user_id, week_start, total_distance_km, total_duration_seconds, run_count, total_elevation_gain)
    SELECT
      v_user_id, v_old_week_start,
      COALESCE(SUM(distance_km), 0),
      COALESCE(SUM(duration_seconds), 0)::integer,
      COUNT(*)::integer,
      COALESCE(SUM(elevation_gain), 0)
    FROM runs
    WHERE user_id = v_user_id
      AND date_trunc('week', started_at)::date = v_old_week_start
    ON CONFLICT (user_id, week_start) DO UPDATE SET
      total_distance_km = EXCLUDED.total_distance_km,
      total_duration_seconds = EXCLUDED.total_duration_seconds,
      run_count = EXCLUDED.run_count,
      total_elevation_gain = EXCLUDED.total_elevation_gain,
      updated_at = now();
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO run_stats_lifetime (user_id, total_distance_km, total_duration_seconds, total_runs, total_elevation_gain, longest_run_km, best_pace_sec_per_km)
    VALUES (v_user_id, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE run_stats_lifetime SET
      total_distance_km = total_distance_km + COALESCE(NEW.distance_km, 0),
      total_duration_seconds = total_duration_seconds + COALESCE(NEW.duration_seconds, 0),
      total_runs = total_runs + 1,
      total_elevation_gain = total_elevation_gain + COALESCE(NEW.elevation_gain, 0),
      longest_run_km = GREATEST(longest_run_km, COALESCE(NEW.distance_km, 0)),
      best_pace_sec_per_km = CASE
        WHEN NEW.distance_km >= 3 AND NEW.duration_seconds > 0 THEN
          LEAST(
            CASE WHEN best_pace_sec_per_km = 0 OR best_pace_sec_per_km IS NULL THEN 999999::numeric ELSE best_pace_sec_per_km END,
            NEW.duration_seconds::numeric / NULLIF(NEW.distance_km, 0)
          )
        ELSE best_pace_sec_per_km
      END,
      updated_at = now()
    WHERE user_id = v_user_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE run_stats_lifetime SET
      total_distance_km = GREATEST(0, total_distance_km - COALESCE(OLD.distance_km, 0)),
      total_duration_seconds = GREATEST(0, total_duration_seconds - COALESCE(OLD.duration_seconds, 0)),
      total_runs = GREATEST(0, total_runs - 1),
      total_elevation_gain = GREATEST(0, total_elevation_gain - COALESCE(OLD.elevation_gain, 0)),
      longest_run_km = COALESCE((SELECT MAX(distance_km) FROM runs WHERE user_id = v_user_id), 0),
      best_pace_sec_per_km = COALESCE(
        (
          SELECT MIN(CASE
            WHEN distance_km >= 3 AND duration_seconds > 0
            THEN duration_seconds::numeric / NULLIF(distance_km, 0)
          END)
          FROM runs
          WHERE user_id = v_user_id
        ),
        0
      ),
      updated_at = now()
    WHERE user_id = v_user_id;

  ELSE
    UPDATE run_stats_lifetime SET
      total_distance_km = total_distance_km - COALESCE(OLD.distance_km, 0) + COALESCE(NEW.distance_km, 0),
      total_duration_seconds = total_duration_seconds - COALESCE(OLD.duration_seconds, 0) + COALESCE(NEW.duration_seconds, 0),
      total_elevation_gain = total_elevation_gain - COALESCE(OLD.elevation_gain, 0) + COALESCE(NEW.elevation_gain, 0),
      longest_run_km = COALESCE((SELECT MAX(distance_km) FROM runs WHERE user_id = v_user_id), 0),
      best_pace_sec_per_km = COALESCE(
        (
          SELECT MIN(CASE
            WHEN distance_km >= 3 AND duration_seconds > 0
            THEN duration_seconds::numeric / NULLIF(distance_km, 0)
          END)
          FROM runs
          WHERE user_id = v_user_id
        ),
        0
      ),
      updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
