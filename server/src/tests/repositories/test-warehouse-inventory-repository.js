/**
 * Test Script: Warehouse Inventory Repository Functions
 *
 * Tests:
 *  - insertWarehouseInventoryBulk
 *  - updateWarehouseInventoryQuantityBulk      (with and without warehouseId)
 *  - updateWarehouseInventoryStatusBulk
 *  - updateWarehouseInventoryMetadata
 *  - updateWarehouseInventoryOutboundBulk
 *  - getPaginatedWarehouseInventory
 *
 * Command:
 *   node src/tests/apis/test-warehouse-inventory-repository.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  insertWarehouseInventoryBulk,
  updateWarehouseInventoryQuantityBulk,
  updateWarehouseInventoryStatusBulk,
  updateWarehouseInventoryMetadata,
  updateWarehouseInventoryOutboundBulk,
  getPaginatedWarehouseInventory,
} = require('../../repositories/warehouse-inventory-repository');

const LOG = '[Test: warehouse-inventory-repository]';

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
    const { rows: warehouseRows } = await pool.query(`
      SELECT id FROM warehouses LIMIT 1
    `);

    const { rows: batchRows } = await pool.query(`
      SELECT br.id AS batch_id, br.batch_type
      FROM batch_registry br
      LEFT JOIN warehouse_inventory wi ON wi.batch_id = br.id
      WHERE wi.id IS NULL
      LIMIT 2
    `);

    const { rows: statusRows } = await pool.query(`
      SELECT id, name
      FROM inventory_status
      WHERE name IN ('in_stock', 'out_of_stock')
    `);

    const { rows: userRows } = await pool.query(`
      SELECT id FROM users LIMIT 1
    `);

    if (
      !warehouseRows.length ||
      !batchRows.length ||
      !statusRows.length ||
      !userRows.length
    ) {
      console.warn(
        `${LOG} Missing seed data — need warehouses, batch_registry, inventory_status, users.`
      );
      return;
    }

    const testWarehouseId = warehouseRows[0].id;
    const testUserId = userRows[0].id;
    const inStockStatusId = statusRows.find((r) => r.name === 'in_stock')?.id;
    const outOfStockStatusId = statusRows.find(
      (r) => r.name === 'out_of_stock'
    )?.id;

    if (!inStockStatusId || !outOfStockStatusId) {
      console.warn(
        `${LOG} Missing inventory_status seed data — need in_stock and out_of_stock.`
      );
      return;
    }

    console.log(`${LOG} Resolved test IDs:`);
    console.log(`  warehouse_id:        ${testWarehouseId}`);
    console.log(`  user_id:             ${testUserId}`);
    console.log(`  in_stock_status:     ${inStockStatusId}`);
    console.log(`  out_of_stock_status: ${outOfStockStatusId}`);
    console.log(
      `  batches:             ${batchRows.map((r) => r.batch_id).join(', ')}`
    );

    let insertedIds = [];

    // ─── 2. insertWarehouseInventoryBulk ──────────────────────────────────────
    try {
      console.log(`\n${LOG} [insertWarehouseInventoryBulk]`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const records = batchRows.map((batch, i) => ({
          warehouse_id: testWarehouseId,
          batch_id: batch.batch_id,
          warehouse_quantity: 100 + i * 50,
          reserved_quantity: 0,
          warehouse_fee: 5.0,
          inbound_date: new Date().toISOString(),
          status_id: inStockStatusId,
          created_by: testUserId,
        }));

        const inserted = await insertWarehouseInventoryBulk(records, client);

        await client.query('COMMIT');

        info('Inserted count', inserted.length);
        console.dir(inserted, { depth: null, colors: true });

        insertedIds = inserted.map((r) => r.id);
        pass('insertWarehouseInventoryBulk');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('insertWarehouseInventoryBulk', error);
      results.failed++;
    }

    // ─── 3. updateWarehouseInventoryQuantityBulk — with warehouseId (adjust qty API path) ──
    try {
      console.log(
        `\n${LOG} [updateWarehouseInventoryQuantityBulk] with warehouseId`
      );

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // qty > 0 → inStock
        const updates = insertedIds.map((id, i) => ({
          id,
          warehouseId: testWarehouseId,
          warehouseQuantity: 200 + i * 25,
          reservedQuantity: 10 + i * 5,
          statusId: inStockStatusId,
        }));

        const updated = await updateWarehouseInventoryQuantityBulk(
          updates,
          testUserId,
          client
        );

        await client.query('COMMIT');

        info('Updated count', updated.length);
        updated.forEach((row) => {
          info(
            `  id=${row.id}`,
            `qty=${row.warehouse_quantity}, reserved=${row.reserved_quantity}, status=${row.status_id}`
          );
        });
        pass('updateWarehouseInventoryQuantityBulk — with warehouseId');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('updateWarehouseInventoryQuantityBulk — with warehouseId', error);
      results.failed++;
    }

    // ─── 3a. updateWarehouseInventoryQuantityBulk — without warehouseId (allocation confirm path) ──
    try {
      console.log(
        `\n${LOG} [updateWarehouseInventoryQuantityBulk] without warehouseId`
      );

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // qty = 0 → outOfStock to test status transition
        const updates = insertedIds.map((id) => ({
          id,
          warehouseQuantity: 0,
          reservedQuantity: 0,
          statusId: outOfStockStatusId,
        }));

        const updated = await updateWarehouseInventoryQuantityBulk(
          updates,
          testUserId,
          client
        );

        await client.query('COMMIT');

        info('Updated count', updated.length);
        updated.forEach((row) => {
          info(
            `  id=${row.id}`,
            `qty=${row.warehouse_quantity}, status=${row.status_id}`
          );
        });
        pass('updateWarehouseInventoryQuantityBulk — without warehouseId');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('updateWarehouseInventoryQuantityBulk — without warehouseId', error);
      results.failed++;
    }

    // ─── 3b. updateWarehouseInventoryQuantityBulk — status transition (qty > 0 → inStock) ──
    try {
      console.log(
        `\n${LOG} [updateWarehouseInventoryQuantityBulk] status transition qty > 0 → inStock`
      );

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const updates = insertedIds.map((id, i) => ({
          id,
          warehouseId: testWarehouseId,
          warehouseQuantity: 50 + i * 10,
          reservedQuantity: 0,
          statusId: inStockStatusId,
        }));

        const updated = await updateWarehouseInventoryQuantityBulk(
          updates,
          testUserId,
          client
        );

        await client.query('COMMIT');

        info('Updated count', updated.length);
        updated.forEach((row) => {
          info(
            `  id=${row.id}`,
            `qty=${row.warehouse_quantity}, status=${row.status_id}`
          );
        });

        const allInStock = updated.every(
          (r) => r.status_id === inStockStatusId
        );
        if (!allInStock)
          throw new Error('Expected all rows to have inStockStatusId');

        pass(
          'updateWarehouseInventoryQuantityBulk — status transition inStock'
        );
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail(
        'updateWarehouseInventoryQuantityBulk — status transition inStock',
        error
      );
      results.failed++;
    }

    // ─── 4. updateWarehouseInventoryStatusBulk ────────────────────────────────
    try {
      console.log(`\n${LOG} [updateWarehouseInventoryStatusBulk]`);

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const updates = insertedIds.map((id) => ({
          id,
          statusId: outOfStockStatusId,
        }));

        const updated = await updateWarehouseInventoryStatusBulk(
          updates,
          testWarehouseId,
          testUserId,
          client
        );

        await client.query('COMMIT');

        info('Updated count', updated.length);
        updated.forEach((row) => {
          info(
            `  id=${row.id}`,
            `status_id=${row.status_id}, status_date=${row.status_date}`
          );
        });
        pass('updateWarehouseInventoryStatusBulk');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('updateWarehouseInventoryStatusBulk', error);
      results.failed++;
    }

    // ─── 5. updateWarehouseInventoryMetadata ──────────────────────────────────
    try {
      console.log(`\n${LOG} [updateWarehouseInventoryMetadata]`);

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const updated = await updateWarehouseInventoryMetadata(
          {
            id: insertedIds[0],
            warehouseId: testWarehouseId,
            inboundDate: '2025-01-15T08:00:00.000Z',
            warehouseFee: '12.50',
            updatedBy: testUserId,
          },
          client
        );

        await client.query('COMMIT');

        info('Updated id', updated?.id);
        info('inbound_date', updated?.inbound_date);
        info('warehouse_fee', updated?.warehouse_fee);
        pass('updateWarehouseInventoryMetadata');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('updateWarehouseInventoryMetadata', error);
      results.failed++;
    }

    // ─── 5a. updateWarehouseInventoryMetadata — partial (fee only) ────────────
    try {
      console.log(
        `\n${LOG} [updateWarehouseInventoryMetadata] partial — fee only`
      );

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const updated = await updateWarehouseInventoryMetadata(
          {
            id: insertedIds[0],
            warehouseId: testWarehouseId,
            warehouseFee: '8.75',
            updatedBy: testUserId,
          },
          client
        );

        await client.query('COMMIT');

        info('Updated id', updated?.id);
        info('inbound_date (unchanged)', updated?.inbound_date);
        info('warehouse_fee', updated?.warehouse_fee);
        pass('updateWarehouseInventoryMetadata — partial');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('updateWarehouseInventoryMetadata — partial', error);
      results.failed++;
    }

    // ─── 6. updateWarehouseInventoryOutboundBulk ──────────────────────────────
    try {
      console.log(`\n${LOG} [updateWarehouseInventoryOutboundBulk]`);

      if (insertedIds.length === 0)
        throw new Error('No inserted records to update');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const updates = insertedIds.map((id) => ({
          id,
          outboundDate: new Date().toISOString(),
          warehouseQuantity: 0,
          reservedQuantity: 0,
          statusId: outOfStockStatusId,
        }));

        const updated = await updateWarehouseInventoryOutboundBulk(
          updates,
          testWarehouseId,
          testUserId,
          client
        );

        await client.query('COMMIT');

        info('Updated count', updated.length);
        updated.forEach((row) => {
          info(
            `  id=${row.id}`,
            `qty=${row.warehouse_quantity}, outbound=${row.outbound_date}, status=${row.status_id}`
          );
        });
        pass('updateWarehouseInventoryOutboundBulk');
        results.passed++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      fail('updateWarehouseInventoryOutboundBulk', error);
      results.failed++;
    }

    // ─── 7. getPaginatedWarehouseInventory ────────────────────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedWarehouseInventory] no filters`);

      const result = await getPaginatedWarehouseInventory({
        filters: { warehouseId: testWarehouseId },
        page: 1,
        limit: 10,
      });

      info('Total records', result.pagination.totalRecords);
      info('Page count', result.data.length);
      console.dir(result.data.slice(0, 2), { depth: null, colors: true });
      pass('getPaginatedWarehouseInventory — no filters');
      results.passed++;
    } catch (error) {
      fail('getPaginatedWarehouseInventory — no filters', error);
      results.failed++;
    }

    // ─── 7a. getPaginatedWarehouseInventory — with search ─────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedWarehouseInventory] search filter`);

      const result = await getPaginatedWarehouseInventory({
        filters: { warehouseId: testWarehouseId, search: 'LOT' },
        page: 1,
        limit: 10,
      });

      info('Total records', result.pagination.totalRecords);
      info('Page count', result.data.length);
      pass('getPaginatedWarehouseInventory — search filter');
      results.passed++;
    } catch (error) {
      fail('getPaginatedWarehouseInventory — search filter', error);
      results.failed++;
    }

    // ─── 7b. getPaginatedWarehouseInventory — hasReserved ─────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedWarehouseInventory] hasReserved=true`);

      const result = await getPaginatedWarehouseInventory({
        filters: { warehouseId: testWarehouseId, hasReserved: true },
        page: 1,
        limit: 10,
      });

      info('Total records', result.pagination.totalRecords);
      pass('getPaginatedWarehouseInventory — hasReserved');
      results.passed++;
    } catch (error) {
      fail('getPaginatedWarehouseInventory — hasReserved', error);
      results.failed++;
    }

    // ─── 7c. getPaginatedWarehouseInventory — batchType filter ────────────────
    try {
      console.log(
        `\n${LOG} [getPaginatedWarehouseInventory] batchType=product`
      );

      const result = await getPaginatedWarehouseInventory({
        filters: { warehouseId: testWarehouseId, batchType: 'product' },
        page: 1,
        limit: 10,
      });

      info('Total records', result.pagination.totalRecords);
      pass('getPaginatedWarehouseInventory — batchType');
      results.passed++;
    } catch (error) {
      fail('getPaginatedWarehouseInventory — batchType', error);
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
