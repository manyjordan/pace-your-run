-- Disable the run stats trigger — causing excessive Disk IO
DROP TRIGGER IF EXISTS trigger_update_run_stats ON runs;
DROP FUNCTION IF EXISTS update_run_stats();
