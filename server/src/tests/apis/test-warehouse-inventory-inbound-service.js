/**
 * Test Script: Warehouse Inventory Inbound Service
 *
 * Tests:
 *  - createWarehouseInventoryService — single record
 *  - createWarehouseInventoryService — bulk records
 *  - createWarehouseInventoryService — duplicate batch rejection
 *  - createWarehouseInventoryService — invalid batch ID rejection
 *  - createWarehouseInventoryService — invalid quantity rejection
 *  - createWarehouseInventoryService — custom status
 *
 * Command:
 *   node src/tests/apis/test-warehouse-inventory-inbound-service.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  createWarehouseInventoryService,
} = require('../../services/warehouse-inventory-service');

const LOG = '[Test: warehouse-inventory-inbound-service]';

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
    const { rows: warehouseRows } = await pool.query(
      `SELECT id FROM warehouses LIMIT 1`
    );

    const { rows: userRows } = await pool.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );

    // Batches not yet in warehouse_inventory
    const { rows: availableBatches } = await pool.query(`
      SELECT br.id AS batch_id
      FROM batch_registry br
      LEFT JOIN warehouse_inventory wi
        ON wi.batch_id = br.id
      WHERE wi.id IS NULL
      LIMIT 4
    `);

    const { rows: statusRows } = await pool.query(
      `SELECT id, name FROM inventory_status LIMIT 2`
    );

    if (
      !warehouseRows.length ||
      !userRows.length ||
      availableBatches.length < 4 ||
      !statusRows.length
    ) {
      console.warn(
        `${LOG} Missing seed data — need warehouses, users, 4+ unassigned batch_registry rows, inventory_status.`
      );
      return;
    }

    const testWarehouseId = warehouseRows[0].id;
    const testUser = {
      id: userRows[0].id,
      role: userRows[0].role_id,
      roleName: userRows[0].role_name,
    };
    const altStatusId = statusRows[1]?.id || statusRows[0].id;

    console.log(`${LOG} Resolved test IDs:`);
    console.log(`  warehouse_id:    ${testWarehouseId}`);
    console.log(`  user_id:         ${testUser.id}`);
    console.log(
      `  available batch: ${availableBatches.map((r) => r.batch_id).join(', ')}`
    );
    console.log(`  alt_status_id:   ${altStatusId}`);

    let firstInsertedIds = [];

    // ─── 2. Single record inbound ─────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [createWarehouseInventoryService] single record`);

      const result = await createWarehouseInventoryService({
        warehouseId: testWarehouseId,
        records: [
          {
            batchId: availableBatches[0].batch_id,
            warehouseQuantity: 100,
            warehouseFee: '5.00',
          },
        ],
        user: testUser,
      });

      info('Count', result.count);
      info('IDs', result.ids);
      firstInsertedIds = result.ids;

      // Verify activity log was created
      const { rows: logRows } = await pool.query(
        `SELECT id, previous_quantity, quantity_change, new_quantity, checksum
         FROM inventory_activity_log
         WHERE warehouse_inventory_id = ANY($1::uuid[])`,
        [result.ids]
      );
      info('Log entries', logRows.length);
      logRows.forEach((row) => {
        info(
          `  log=${row.id}`,
          `prev=${row.previous_quantity}, change=${row.quantity_change}, new=${row.new_quantity}`
        );
      });

      if (result.count !== 1)
        throw new Error(`Expected count=1, got ${result.count}`);
      if (logRows.length !== 1)
        throw new Error(`Expected 1 log entry, got ${logRows.length}`);
      if (logRows[0].previous_quantity !== 0)
        throw new Error('Expected previous_quantity=0');
      if (logRows[0].quantity_change !== 100)
        throw new Error('Expected quantity_change=100');
      if (logRows[0].new_quantity !== 100)
        throw new Error('Expected new_quantity=100');

      pass('createWarehouseInventoryService — single record');
      results.passed++;
    } catch (error) {
      fail('createWarehouseInventoryService — single record', error);
      results.failed++;
    }

    // ─── 3. Bulk records inbound ──────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [createWarehouseInventoryService] bulk records`);

      const result = await createWarehouseInventoryService({
        warehouseId: testWarehouseId,
        records: [
          { batchId: availableBatches[1].batch_id, warehouseQuantity: 200 },
          { batchId: availableBatches[2].batch_id, warehouseQuantity: 300 },
        ],
        user: testUser,
      });

      info('Count', result.count);
      info('IDs', result.ids);

      const { rows: logRows } = await pool.query(
        `SELECT id FROM inventory_activity_log
         WHERE warehouse_inventory_id = ANY($1::uuid[])`,
        [result.ids]
      );
      info('Log entries', logRows.length);

      if (result.count !== 2)
        throw new Error(`Expected count=2, got ${result.count}`);
      if (logRows.length !== 2)
        throw new Error(`Expected 2 log entries, got ${logRows.length}`);

      pass('createWarehouseInventoryService — bulk records');
      results.passed++;
    } catch (error) {
      fail('createWarehouseInventoryService — bulk records', error);
      results.failed++;
    }

    // ─── 4. Duplicate batch rejection ─────────────────────────────────────────
    try {
      console.log(
        `\n${LOG} [createWarehouseInventoryService] duplicate batch rejection`
      );

      await createWarehouseInventoryService({
        warehouseId: testWarehouseId,
        records: [
          { batchId: availableBatches[0].batch_id, warehouseQuantity: 50 },
        ],
        user: testUser,
      });

      fail(
        'createWarehouseInventoryService — duplicate batch',
        new Error('Should have thrown')
      );
      results.failed++;
    } catch (error) {
      if (error.message.includes('already have inventory')) {
        info('Rejected with', error.message);
        pass('createWarehouseInventoryService — duplicate batch rejection');
        results.passed++;
      } else {
        fail(
          'createWarehouseInventoryService — duplicate batch rejection',
          error
        );
        results.failed++;
      }
    }

    // ─── 5. Invalid batch ID rejection ────────────────────────────────────────
    try {
      console.log(
        `\n${LOG} [createWarehouseInventoryService] invalid batch ID`
      );

      await createWarehouseInventoryService({
        warehouseId: testWarehouseId,
        records: [
          {
            batchId: '00000000-0000-0000-0000-000000000000',
            warehouseQuantity: 50,
          },
        ],
        user: testUser,
      });

      fail(
        'createWarehouseInventoryService — invalid batch ID',
        new Error('Should have thrown')
      );
      results.failed++;
    } catch (error) {
      if (error.message.includes('do not exist')) {
        info('Rejected with', error.message);
        pass('createWarehouseInventoryService — invalid batch ID rejection');
        results.passed++;
      } else {
        fail(
          'createWarehouseInventoryService — invalid batch ID rejection',
          error
        );
        results.failed++;
      }
    }

    // ─── 6. Invalid quantity rejection ────────────────────────────────────────
    try {
      console.log(
        `\n${LOG} [createWarehouseInventoryService] invalid quantity`
      );

      await createWarehouseInventoryService({
        warehouseId: testWarehouseId,
        records: [
          { batchId: availableBatches[3].batch_id, warehouseQuantity: -5 },
        ],
        user: testUser,
      });

      fail(
        'createWarehouseInventoryService — invalid quantity',
        new Error('Should have thrown')
      );
      results.failed++;
    } catch (error) {
      if (error.message.includes('positive integer')) {
        info('Rejected with', error.message);
        pass('createWarehouseInventoryService — invalid quantity rejection');
        results.passed++;
      } else {
        fail(
          'createWarehouseInventoryService — invalid quantity rejection',
          error
        );
        results.failed++;
      }
    }

    // ─── 7. Custom status ─────────────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [createWarehouseInventoryService] custom status`);

      const result = await createWarehouseInventoryService({
        warehouseId: testWarehouseId,
        records: [
          {
            batchId: availableBatches[3].batch_id,
            warehouseQuantity: 75,
            statusId: altStatusId,
          },
        ],
        user: testUser,
      });

      info('Count', result.count);

      // Verify status was applied
      const { rows } = await pool.query(
        `SELECT status_id FROM warehouse_inventory WHERE id = $1`,
        [result.ids[0]]
      );
      info('Applied status_id', rows[0]?.status_id);

      if (rows[0]?.status_id !== altStatusId) {
        throw new Error(
          `Expected status=${altStatusId}, got ${rows[0]?.status_id}`
        );
      }

      pass('createWarehouseInventoryService — custom status');
      results.passed++;
    } catch (error) {
      fail('createWarehouseInventoryService — custom status', error);
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
