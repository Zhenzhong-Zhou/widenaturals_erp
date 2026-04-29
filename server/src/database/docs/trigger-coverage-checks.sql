-- ============================================================
-- Trigger Coverage Verification Queries
-- ============================================================
-- Run these queries to verify trigger coverage is complete
-- after any schema changes or new table additions.
--
-- Workflow:
--   1. Run Step 1 to get the current table baseline
--   2. Run Steps 2–4 to find missing triggers
--   3. Run Step 5 to find stale triggers on dropped tables
--   4. Create a new migration to fix any gaps found
-- ============================================================

-- ─── Step 1: All public base tables ──────────────────────────────────────────
-- Baseline — compare against ALLOWED set in server-health or lock-modes utils.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ─── Step 2: Tables with updated_at column but missing updated_at trigger ────
-- Any result here needs a set_*_updated_at trigger in a new migration.
SELECT c.table_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name = 'updated_at'
  AND c.table_name NOT IN (
    SELECT DISTINCT event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema    = 'public'
      AND action_timing     = 'BEFORE'
      AND event_manipulation = 'UPDATE'
      AND action_statement  LIKE '%update_updated_at_column%'
  )
ORDER BY c.table_name;

-- ─── Step 3: Tables with status_id but missing default status trigger ─────────
-- Excludes system/log/lookup tables that set status explicitly.
-- Any domain table in results needs a set_*_default_status_id trigger.
SELECT c.table_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name = 'status_id'
  AND c.table_name NOT IN (
    SELECT DISTINCT event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND action_statement LIKE '%set_default_status_id%'
  )
ORDER BY c.table_name;

-- ─── Step 4: Tables with status_id + status_date but missing status date trigger
-- Any result here needs a trg_*_status_date trigger in a new migration.
SELECT c1.table_name
FROM information_schema.columns c1
JOIN information_schema.columns c2
  ON c1.table_schema = c2.table_schema
  AND c1.table_name  = c2.table_name
WHERE c1.table_schema = 'public'
  AND c1.column_name  = 'status_id'
  AND c2.column_name  = 'status_date'
  AND c1.table_name NOT IN (
    SELECT DISTINCT event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND action_statement LIKE '%update_status_date_if_changed%'
  )
ORDER BY c1.table_name;

-- ─── Step 5: Stale triggers referencing dropped tables ───────────────────────
-- Any result here means a trigger exists for a table that no longer exists.
-- Drop these in a new migration.
SELECT t.trigger_name, t.event_object_table
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
  AND t.event_object_table NOT IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  )
ORDER BY t.event_object_table;

-- ─── Step 6: Tables excluded from default status trigger (expected) ──────────
-- These tables have status_id but intentionally have no default status trigger.
-- Update this list when new system/log tables are added.
--
-- auth_action_status    — lookup table, status set explicitly
-- auth_action_types     — lookup table, status set explicitly
-- inventory_activity_log — append-only log, no default status needed
