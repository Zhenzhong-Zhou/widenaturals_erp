/**
 * Test Script: Inventory Allocation Repository — Paginated Allocations
 *
 * Tests:
 *  - getPaginatedInventoryAllocations (no filters)
 *  - getPaginatedInventoryAllocations (warehouse filter)
 *  - getPaginatedInventoryAllocations (status filter)
 *  - getPaginatedInventoryAllocations (order number keyword)
 *  - getPaginatedInventoryAllocations (sort variations)
 *  - getPaginatedInventoryAllocations (pagination boundary)
 *
 * Command:
 *   node src/tests/apis/test-inventory-allocation-repository.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  getPaginatedInventoryAllocations,
} = require('../../repositories/inventory-allocations-repository');

const LOG = '[Test: inventory-allocation-repository]';

const pass = (label) => console.log(`\n  ✅ PASS — ${label}`);
const fail = (label, error) =>
  console.error(`\n  ❌ FAIL — ${label}\n     ${error.message}`);
const info = (label, value) => console.log(`     ${label}:`, value);

(async () => {
  const results = { passed: 0, failed: 0 };

  try {
    // ─── 0. Status Cache ──────────────────────────────────────────────────────
    await initStatusCache();
    console.log(`${LOG} Status cache ready.\n`);

    // ─── 1. Fetch real IDs from DB ────────────────────────────────────────────
    const { rows: seedRows } = await pool.query(`
      SELECT
        ia.id            AS allocation_id,
        ia.status_id,
        ia.warehouse_id,
        oi.order_id,
        o.order_number
      FROM inventory_allocations ia
      JOIN order_items oi ON oi.id = ia.order_item_id
      JOIN orders o       ON o.id = oi.order_id
      LIMIT 1
    `);

    if (!seedRows.length) {
      console.warn(`${LOG} No allocation rows found — seed data required.`);
      return;
    }

    const testWarehouseId = seedRows[0].warehouse_id;
    const testStatusId = seedRows[0].status_id;
    const testOrderNumber = seedRows[0].order_number;

    console.log(`${LOG} Resolved test IDs:`);
    console.log(`  warehouse_id:  ${testWarehouseId}`);
    console.log(`  status_id:     ${testStatusId}`);
    console.log(`  order_number:  ${testOrderNumber}`);

    // ─── 2. No filters ───────────────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedInventoryAllocations] no filters`);
      const result = await getPaginatedInventoryAllocations({
        filters: {},
        page: 1,
        limit: 5,
      });
      info('Total records', result.pagination.totalRecords);
      info('Total pages', result.pagination.totalPages);
      info('Row count', result.data.length);
      console.dir(result.data[0], { depth: null, colors: true });
      pass('no filters');
      results.passed++;
    } catch (error) {
      fail('no filters', error);
      results.failed++;
    }

    // ─── 3. Warehouse filter ─────────────────────────────────────────────────
    try {
      console.log(
        `\n${LOG} [getPaginatedInventoryAllocations] warehouse filter`
      );
      const result = await getPaginatedInventoryAllocations({
        filters: { warehouseIds: [testWarehouseId] },
        page: 1,
        limit: 5,
      });
      info('Total records', result.pagination.totalRecords);
      info('Row count', result.data.length);
      pass('warehouse filter');
      results.passed++;
    } catch (error) {
      fail('warehouse filter', error);
      results.failed++;
    }

    // ─── 4. Status filter ────────────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedInventoryAllocations] status filter`);
      const result = await getPaginatedInventoryAllocations({
        filters: { statusIds: [testStatusId] },
        page: 1,
        limit: 5,
      });
      info('Total records', result.pagination.totalRecords);
      info('Row count', result.data.length);
      pass('status filter');
      results.passed++;
    } catch (error) {
      fail('status filter', error);
      results.failed++;
    }

    // ─── 5. Keyword (order number) ───────────────────────────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedInventoryAllocations] keyword filter`);
      const result = await getPaginatedInventoryAllocations({
        filters: { keyword: testOrderNumber },
        page: 1,
        limit: 5,
      });
      info('Total records', result.pagination.totalRecords);
      info('Row count', result.data.length);
      const match = result.data.every((row) =>
        row.order_number.includes(testOrderNumber)
      );
      info('All rows match keyword', match);
      pass('keyword filter');
      results.passed++;
    } catch (error) {
      fail('keyword filter', error);
      results.failed++;
    }

    // ─── 6. Sort by allocatedAt ASC ──────────────────────────────────────────
    try {
      console.log(
        `\n${LOG} [getPaginatedInventoryAllocations] sort allocatedAt ASC`
      );
      const result = await getPaginatedInventoryAllocations({
        filters: {},
        page: 1,
        limit: 5,
        sortBy: 'allocatedAt',
        sortOrder: 'ASC',
      });
      info('Row count', result.data.length);
      if (result.data.length >= 2) {
        const first = result.data[0].allocated_at;
        const last = result.data[result.data.length - 1].allocated_at;
        info('First allocated_at', first);
        info('Last allocated_at', last);
        info('ASC order correct', new Date(first) <= new Date(last));
      }
      pass('sort allocatedAt ASC');
      results.passed++;
    } catch (error) {
      fail('sort allocatedAt ASC', error);
      results.failed++;
    }

    // ─── 7. Sort by orderNumber DESC ─────────────────────────────────────────
    try {
      console.log(
        `\n${LOG} [getPaginatedInventoryAllocations] sort orderNumber DESC`
      );
      const result = await getPaginatedInventoryAllocations({
        filters: {},
        page: 1,
        limit: 5,
        sortBy: 'orderNumber',
        sortOrder: 'DESC',
      });
      info('Row count', result.data.length);
      pass('sort orderNumber DESC');
      results.passed++;
    } catch (error) {
      fail('sort orderNumber DESC', error);
      results.failed++;
    }

    // ─── 8. Pagination boundary — page beyond total ──────────────────────────
    try {
      console.log(
        `\n${LOG} [getPaginatedInventoryAllocations] page beyond total`
      );
      const result = await getPaginatedInventoryAllocations({
        filters: {},
        page: 9999,
        limit: 10,
      });
      info('Total records', result.pagination.totalRecords);
      info('Row count', result.data.length);
      info('Returns empty', result.data.length === 0);
      pass('page beyond total');
      results.passed++;
    } catch (error) {
      fail('page beyond total', error);
      results.failed++;
    }

    // ─── 9. Combined filters — warehouse + status ────────────────────────────
    try {
      console.log(
        `\n${LOG} [getPaginatedInventoryAllocations] combined filters`
      );
      const result = await getPaginatedInventoryAllocations({
        filters: {
          warehouseIds: [testWarehouseId],
          statusIds: [testStatusId],
        },
        page: 1,
        limit: 5,
      });
      info('Total records', result.pagination.totalRecords);
      info('Row count', result.data.length);
      pass('combined filters');
      results.passed++;
    } catch (error) {
      fail('combined filters', error);
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
