-- Index sur runs.user_id (filtré à chaque getRuns)
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);

-- Index sur runs.started_at (trié à chaque getRuns)
CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);

-- Index composé pour les deux ensemble
CREATE INDEX IF NOT EXISTS idx_runs_user_started ON runs(user_id, started_at DESC);

-- Index sur follows pour le feed social
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Index sur forum_threads.category_id
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);

-- Index sur forum_threads.created_at
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON forum_threads(created_at DESC);
-- Index sur runs.user_id (filtré à chaque getRuns)
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);

-- Index sur runs.started_at (trié à chaque getRuns)
CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);

-- Index composé pour les deux ensemble
CREATE INDEX IF NOT EXISTS idx_runs_user_started ON runs(user_id, started_at DESC);

-- Index sur follows pour le feed social
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Index sur forum_threads.category_id
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id);

-- Index sur forum_threads.created_at
CREATE INDEX IF NOT EXISTS idx_forum_threads_created ON forum_threads(created_at DESC);
