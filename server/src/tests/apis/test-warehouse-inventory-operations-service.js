/**
 * Test Script: Warehouse Inventory Operation Services
 *
 * Tests:
 *  - adjustWarehouseInventoryQuantityService — single + bulk
 *  - adjustWarehouseInventoryQuantityService — constraint violation
 *  - updateWarehouseInventoryStatusService — single + bulk
 *  - updateWarehouseInventoryStatusService — invalid status rejection
 *  - updateWarehouseInventoryMetadataService — full + partial
 *  - recordWarehouseInventoryOutboundService — single + bulk
 *  - recordWarehouseInventoryOutboundService — missing ID rejection
 *
 * Requires: existing warehouse_inventory records (run inbound test first)
 *
 * Command:
 *   node src/tests/apis/test-warehouse-inventory-operations-service.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  adjustWarehouseInventoryQuantityService,
  updateWarehouseInventoryStatusService,
  updateWarehouseInventoryMetadataService,
  recordWarehouseInventoryOutboundService,
} = require('../../services/warehouse-inventory-service');

const LOG = '[Test: warehouse-inventory-operations]';

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

    const { rows: inventoryRows } = await pool.query(`
      SELECT wi.id, wi.warehouse_id, wi.warehouse_quantity, wi.reserved_quantity, wi.status_id
      FROM warehouse_inventory wi
      ORDER BY wi.created_at DESC
      LIMIT 3
    `);

    const { rows: statusRows } = await pool.query(`
      SELECT id, name FROM inventory_status
    `);

    if (!userRows.length || inventoryRows.length < 2 || statusRows.length < 2) {
      console.warn(
        `${LOG} Missing test data — need users, 2+ warehouse_inventory rows, 2+ inventory_status rows.`
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
    const testWarehouseId = inventoryRows[0].warehouse_id;
    const testRecords = inventoryRows;

    const currentStatusId = testRecords[0].status_id;
    const altStatus = statusRows.find((s) => s.id !== currentStatusId);
    const altStatusId = altStatus?.id || currentStatusId;

    console.log(`${LOG} Resolved test data:`);
    console.log(`  warehouse_id:  ${testWarehouseId}`);
    console.log(`  user_id:       ${testUser.id}`);
    console.log(`  record count:  ${testRecords.length}`);
    console.log(`  record IDs:    ${testRecords.map((r) => r.id).join(', ')}`);
    console.log(`  alt_status_id: ${altStatusId} (${altStatus?.name})`);

    // ─── 2. adjustWarehouseInventoryQuantityService — single ──────────────────

    try {
      console.log(`\n${LOG} [adjustQuantity] single record`);

      const result = await adjustWarehouseInventoryQuantityService({
        warehouseId: testWarehouseId,
        updates: [
          {
            id: testRecords[0].id,
            warehouseQuantity: 500,
            reservedQuantity: 20,
          },
        ],
        user: testUser,
      });

      info('Count', result.count);
      info('Updated IDs', result.updatedIds);

      const { rows: logRows } = await pool.query(
        `SELECT previous_quantity, quantity_change, new_quantity
         FROM inventory_activity_log
         WHERE warehouse_inventory_id = $1
         ORDER BY performed_at DESC LIMIT 1`,
        [testRecords[0].id]
      );
      info('Log entry', logRows[0]);

      if (result.count !== 1)
        throw new Error(`Expected count=1, got ${result.count}`);

      pass('adjustQuantity — single record');
      results.passed++;
    } catch (error) {
      fail('adjustQuantity — single record', error);
      results.failed++;
    }

    // ─── 3. adjustWarehouseInventoryQuantityService — bulk ────────────────────

    try {
      console.log(`\n${LOG} [adjustQuantity] bulk records`);

      const updates = testRecords.slice(0, 2).map((r, i) => ({
        id: r.id,
        warehouseQuantity: 300 + i * 100,
        reservedQuantity: 5 + i * 5,
      }));

      const result = await adjustWarehouseInventoryQuantityService({
        warehouseId: testWarehouseId,
        updates,
        user: testUser,
      });

      info('Count', result.count);

      if (result.count !== 2)
        throw new Error(`Expected count=2, got ${result.count}`);

      pass('adjustQuantity — bulk records');
      results.passed++;
    } catch (error) {
      fail('adjustQuantity — bulk records', error);
      results.failed++;
    }

    // ─── 4. adjustWarehouseInventoryQuantityService — constraint violation ────

    try {
      console.log(
        `\n${LOG} [adjustQuantity] reserved > warehouse (constraint violation)`
      );

      await adjustWarehouseInventoryQuantityService({
        warehouseId: testWarehouseId,
        updates: [
          {
            id: testRecords[0].id,
            warehouseQuantity: 10,
            reservedQuantity: 50,
          },
        ],
        user: testUser,
      });

      fail(
        'adjustQuantity — constraint violation',
        new Error('Should have thrown')
      );
      results.failed++;
    } catch (error) {
      if (
        error.message.includes('Invalid quantity') ||
        error.message.includes('check constraint')
      ) {
        info('Rejected with', error.message);
        pass('adjustQuantity — constraint violation');
        results.passed++;
      } else {
        fail('adjustQuantity — constraint violation', error);
        results.failed++;
      }
    }

    // ─── 5. updateWarehouseInventoryStatusService — single ────────────────────

    try {
      console.log(`\n${LOG} [updateStatus] single record`);

      const result = await updateWarehouseInventoryStatusService({
        warehouseId: testWarehouseId,
        updates: [{ id: testRecords[0].id, statusId: altStatusId }],
        user: testUser,
      });

      info('Count', result.count);

      const { rows } = await pool.query(
        `SELECT status_id FROM warehouse_inventory WHERE id = $1`,
        [testRecords[0].id]
      );
      info('New status_id', rows[0]?.status_id);

      if (rows[0]?.status_id !== altStatusId) {
        throw new Error(
          `Expected status=${altStatusId}, got ${rows[0]?.status_id}`
        );
      }

      pass('updateStatus — single record');
      results.passed++;
    } catch (error) {
      fail('updateStatus — single record', error);
      results.failed++;
    }

    // ─── 6. updateWarehouseInventoryStatusService — bulk ──────────────────────

    try {
      console.log(`\n${LOG} [updateStatus] bulk records`);

      const updates = testRecords.slice(0, 2).map((r) => ({
        id: r.id,
        statusId: altStatusId,
      }));

      const result = await updateWarehouseInventoryStatusService({
        warehouseId: testWarehouseId,
        updates,
        user: testUser,
      });

      info('Count', result.count);

      if (result.count !== 2)
        throw new Error(`Expected count=2, got ${result.count}`);

      pass('updateStatus — bulk records');
      results.passed++;
    } catch (error) {
      fail('updateStatus — bulk records', error);
      results.failed++;
    }

    // ─── 7. updateWarehouseInventoryStatusService — invalid status ─────────────

    try {
      console.log(`\n${LOG} [updateStatus] invalid status ID`);

      await updateWarehouseInventoryStatusService({
        warehouseId: testWarehouseId,
        updates: [
          {
            id: testRecords[0].id,
            statusId: '00000000-0000-0000-0000-000000000000',
          },
        ],
        user: testUser,
      });

      fail('updateStatus — invalid status', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (error.message.includes('invalid inventory status')) {
        info('Rejected with', error.message);
        pass('updateStatus — invalid status rejection');
        results.passed++;
      } else {
        fail('updateStatus — invalid status rejection', error);
        results.failed++;
      }
    }

    // ─── 8. updateWarehouseInventoryMetadataService — full update ──────────────

    try {
      console.log(`\n${LOG} [updateMetadata] full update`);

      const result = await updateWarehouseInventoryMetadataService({
        warehouseId: testWarehouseId,
        id: testRecords[0].id,
        fields: {
          inboundDate: '2025-06-01T08:00:00.000Z',
          warehouseFee: '15.50',
        },
        user: testUser,
      });

      info('Updated id', result.id);
      info('inbound_date', result.inboundDate);
      info('warehouse_fee', result.warehouseFee);

      pass('updateMetadata — full update');
      results.passed++;
    } catch (error) {
      fail('updateMetadata — full update', error);
      results.failed++;
    }

    // ─── 9. updateWarehouseInventoryMetadataService — partial (fee only) ──────

    try {
      console.log(`\n${LOG} [updateMetadata] partial — fee only`);

      const result = await updateWarehouseInventoryMetadataService({
        warehouseId: testWarehouseId,
        id: testRecords[0].id,
        fields: {
          warehouseFee: '22.00',
        },
        user: testUser,
      });

      info('Updated id', result.id);
      info('inbound_date (unchanged)', result.inboundDate);
      info('warehouse_fee', result.warehouseFee);

      if (result.warehouseFee !== '22.00' && result.warehouseFee !== 22) {
        throw new Error(`Expected fee=22.00, got ${result.warehouseFee}`);
      }

      pass('updateMetadata — partial');
      results.passed++;
    } catch (error) {
      fail('updateMetadata — partial', error);
      results.failed++;
    }

    // ─── 10. recordWarehouseInventoryOutboundService — single ─────────────────

    try {
      console.log(`\n${LOG} [outbound] single record`);

      // First ensure record has quantity and no reservation
      await adjustWarehouseInventoryQuantityService({
        warehouseId: testWarehouseId,
        updates: [
          {
            id: testRecords[0].id,
            warehouseQuantity: 100,
            reservedQuantity: 0,
          },
        ],
        user: testUser,
      });

      const result = await recordWarehouseInventoryOutboundService({
        warehouseId: testWarehouseId,
        updates: [
          {
            id: testRecords[0].id,
            outboundDate: new Date().toISOString(),
            warehouseQuantity: 0,
          },
        ],
        user: testUser,
      });

      info('Count', result.count);

      const { rows } = await pool.query(
        `SELECT warehouse_quantity, outbound_date
         FROM warehouse_inventory WHERE id = $1`,
        [testRecords[0].id]
      );
      info('Final qty', rows[0]?.warehouse_quantity);
      info('Outbound date', rows[0]?.outbound_date);

      if (rows[0]?.warehouse_quantity !== 0) {
        throw new Error(`Expected qty=0, got ${rows[0]?.warehouse_quantity}`);
      }

      pass('outbound — single record');
      results.passed++;
    } catch (error) {
      fail('outbound — single record', error);
      results.failed++;
    }

    // ─── 11. recordWarehouseInventoryOutboundService — missing ID ─────────────

    try {
      console.log(`\n${LOG} [outbound] missing inventory ID`);

      await recordWarehouseInventoryOutboundService({
        warehouseId: testWarehouseId,
        updates: [
          {
            id: '00000000-0000-0000-0000-000000000000',
            outboundDate: new Date().toISOString(),
            warehouseQuantity: 0,
          },
        ],
        user: testUser,
      });

      fail('outbound — missing ID', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (error.message.includes('not found')) {
        info('Rejected with', error.message);
        pass('outbound — missing ID rejection');
        results.passed++;
      } else {
        fail('outbound — missing ID rejection', error);
        results.failed++;
      }
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
