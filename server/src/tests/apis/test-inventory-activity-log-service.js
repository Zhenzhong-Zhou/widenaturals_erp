/**
 * Test Script: Inventory Activity Log Service
 *
 * Tests:
 *  - fetchPaginatedActivityLogService — no filters
 *  - fetchPaginatedActivityLogService — inventoryId filter
 *  - fetchPaginatedActivityLogService — actionTypeId filter
 *  - fetchPaginatedActivityLogService — performedBy filter
 *  - fetchPaginatedActivityLogService — date range filter
 *  - fetchPaginatedActivityLogService — empty result
 *
 * Requires: existing inventory_activity_log records (run inbound test first)
 *
 * Command:
 *   node src/tests/apis/test-inventory-activity-log-service.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  fetchPaginatedActivityLogService,
} = require('../../services/inventory-activity-log-service');

const LOG = '[Test: inventory-activity-log-service]';

const pass = (label) => console.log(`\n  ✅ PASS — ${label}`);
const fail = (label, error) =>
  console.error(`\n  ❌ FAIL — ${label}\n     ${error.message}`);
const info = (label, value) => console.log(`     ${label}:`, value);

(async () => {
  const results = { passed: 0, failed: 0 };

  try {
    await initStatusCache();
    console.log(`${LOG} Status cache ready.\n`);

    // ─── 1. Fetch test data ───────────────────────────────────────────────────

    const { rows: userRows } = await pool.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );

    const { rows: logRows } = await pool.query(`
      SELECT
        ial.id,
        ial.warehouse_inventory_id,
        ial.inventory_action_type_id,
        ial.performed_by,
        ial.performed_at,
        wi.warehouse_id
      FROM inventory_activity_log ial
      JOIN warehouse_inventory wi ON wi.id = ial.warehouse_inventory_id
      ORDER BY ial.performed_at DESC
      LIMIT 5
    `);

    if (!userRows.length || !logRows.length) {
      console.warn(
        `${LOG} Missing test data — need users and inventory_activity_log records.`
      );
      console.warn(
        `${LOG} Run test-warehouse-inventory-inbound-service.js first.`
      );
      return;
    }

    const testUser = {
      id: userRows[0].id,
      role: userRows[0].role_id,
      roleName: userRows[0].role_name,
    };
    const testWarehouseId = logRows[0].warehouse_id;
    const testInventoryId = logRows[0].warehouse_inventory_id;
    const testActionTypeId = logRows[0].inventory_action_type_id;
    const testPerformedBy = logRows[0].performed_by;

    console.log(`${LOG} Resolved test data:`);
    console.log(`  warehouse_id:  ${testWarehouseId}`);
    console.log(`  user_id:       ${testUser.id}`);
    console.log(`  inventory_id:  ${testInventoryId}`);
    console.log(`  action_type:   ${testActionTypeId}`);
    console.log(`  performed_by:  ${testPerformedBy}`);
    console.log(`  log count:     ${logRows.length}`);

    // ─── 2. No filters ───────────────────────────────────────────────────────

    try {
      console.log(`\n${LOG} [fetchPaginatedActivityLog] no filters`);

      const result = await fetchPaginatedActivityLogService({
        filters: {
          warehouseId: testWarehouseId,
        },
        page: 1,
        limit: 10,
        user: testUser,
      });

      info('Total records', result.pagination.totalRecords);
      info('Page count', result.data.length);
      console.dir(result.data.slice(0, 2), { depth: null, colors: true });

      if (result.data.length === 0)
        throw new Error('Expected at least one log entry');

      // Verify transformed shape
      const first = result.data[0];
      if (!first.actionTypeName) throw new Error('Missing actionTypeName');
      if (!first.performedAt) throw new Error('Missing performedAt');
      if (first.warehouseInventoryId === undefined)
        throw new Error('Missing warehouseInventoryId');

      pass('fetchPaginatedActivityLog — no filters');
      results.passed++;
    } catch (error) {
      fail('fetchPaginatedActivityLog — no filters', error);
      results.failed++;
    }

    // ─── 3. inventoryId filter ────────────────────────────────────────────────

    try {
      console.log(`\n${LOG} [fetchPaginatedActivityLog] inventoryId filter`);

      const result = await fetchPaginatedActivityLogService({
        filters: {
          warehouseId: testWarehouseId,
          inventoryId: testInventoryId,
        },
        page: 1,
        limit: 10,
        user: testUser,
      });

      info('Total records', result.pagination.totalRecords);

      // All results should belong to the same inventory record
      const allMatch = result.data.every(
        (r) => r.warehouseInventoryId === testInventoryId
      );
      if (!allMatch)
        throw new Error('Results contain entries for other inventory records');

      pass('fetchPaginatedActivityLog — inventoryId filter');
      results.passed++;
    } catch (error) {
      fail('fetchPaginatedActivityLog — inventoryId filter', error);
      results.failed++;
    }

    // ─── 4. actionTypeId filter ───────────────────────────────────────────────

    try {
      console.log(`\n${LOG} [fetchPaginatedActivityLog] actionTypeId filter`);

      const result = await fetchPaginatedActivityLogService({
        filters: {
          warehouseId: testWarehouseId,
          actionTypeId: testActionTypeId,
        },
        page: 1,
        limit: 10,
        user: testUser,
      });

      info('Total records', result.pagination.totalRecords);
      info('Action types', [
        ...new Set(result.data.map((r) => r.actionTypeName)),
      ]);

      pass('fetchPaginatedActivityLog — actionTypeId filter');
      results.passed++;
    } catch (error) {
      fail('fetchPaginatedActivityLog — actionTypeId filter', error);
      results.failed++;
    }

    // ─── 5. performedBy filter ────────────────────────────────────────────────

    try {
      console.log(`\n${LOG} [fetchPaginatedActivityLog] performedBy filter`);

      const result = await fetchPaginatedActivityLogService({
        filters: {
          warehouseId: testWarehouseId,
          performedBy: testPerformedBy,
        },
        page: 1,
        limit: 10,
        user: testUser,
      });

      info('Total records', result.pagination.totalRecords);

      pass('fetchPaginatedActivityLog — performedBy filter');
      results.passed++;
    } catch (error) {
      fail('fetchPaginatedActivityLog — performedBy filter', error);
      results.failed++;
    }

    // ─── 6. Date range filter ─────────────────────────────────────────────────

    try {
      console.log(`\n${LOG} [fetchPaginatedActivityLog] date range filter`);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const result = await fetchPaginatedActivityLogService({
        filters: {
          warehouseId: testWarehouseId,
          performedAtAfter: oneHourAgo,
          performedAtBefore: now,
        },
        page: 1,
        limit: 10,
        user: testUser,
      });

      info('Total records', result.pagination.totalRecords);

      // All results should fall within the range
      const allInRange = result.data.every((r) => {
        const t = new Date(r.performedAt).getTime();
        return (
          t >= new Date(oneHourAgo).getTime() && t <= new Date(now).getTime()
        );
      });
      if (!allInRange)
        throw new Error('Results contain entries outside the date range');

      pass('fetchPaginatedActivityLog — date range filter');
      results.passed++;
    } catch (error) {
      fail('fetchPaginatedActivityLog — date range filter', error);
      results.failed++;
    }

    // ─── 7. Empty result — non-existent inventory ID ──────────────────────────

    try {
      console.log(`\n${LOG} [fetchPaginatedActivityLog] empty result`);

      const result = await fetchPaginatedActivityLogService({
        filters: {
          warehouseId: testWarehouseId,
          inventoryId: '00000000-0000-0000-0000-000000000000',
        },
        page: 1,
        limit: 10,
        user: testUser,
      });

      info('Total records', result.pagination.totalRecords);
      info('Data length', result.data.length);

      if (result.data.length !== 0) throw new Error('Expected empty result');
      if (result.pagination.totalRecords !== 0)
        throw new Error('Expected totalRecords=0');

      pass('fetchPaginatedActivityLog — empty result');
      results.passed++;
    } catch (error) {
      fail('fetchPaginatedActivityLog — empty result', error);
      results.failed++;
    }
  } catch (error) {
    console.error(`${LOG} Fatal setup error:`, error.message);
    console.error(error.stack);
  } finally {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(
      `${LOG} Results: ${results.passed} passed, ${results.failed} failed`
    );
    console.log(`${'─'.repeat(50)}\n`);
    await pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
  }
})();
