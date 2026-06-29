-- ============================================================
-- ROLLBACK SCRIPT for migration: add_hierarchy_columns_and_commission_tx
-- Run if migration fails or needs to be reverted.
-- Usage: psql -U ipl_user -d ipl_betting -f rollback.sql
-- ============================================================

BEGIN;

-- 1. Drop the new table and its dependencies
DROP TABLE IF EXISTS commission_transactions CASCADE;

-- 2. Remove the new columns from user_hierarchy
ALTER TABLE user_hierarchy
  DROP COLUMN IF EXISTS credit_limit,
  DROP COLUMN IF EXISTS exposure_limit,
  DROP COLUMN IF EXISTS max_player_count;

-- 3. Clean up backfill data if it was already run
DELETE FROM user_hierarchy
WHERE user_id IN (
  SELECT id FROM users
);

COMMIT;

-- Verify rollback
SELECT 'rollback complete' AS status;
