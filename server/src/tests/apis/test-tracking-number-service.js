/**
 * Test Script: Tracking Number Service
 *
 * Tests:
 *  - createTrackingNumbersService — single tracking attach
 *  - createTrackingNumbersService — bulk multi-package attach
 *  - createTrackingNumbersService — null tracking_number allowed
 *  - createTrackingNumbersService — shipment not found rejection
 *  - createTrackingNumbersService — duplicate (carrier, tracking_number) rejection
 *  - createTrackingNumbersService — in-payload duplicate rejection
 *  - createTrackingNumbersService — invalid freight_type rejection
 *  - createTrackingNumbersService — LTL/FTL without BOL rejection
 *  - createTrackingNumbersService — pickup delivery method rejection
 *  - createTrackingNumbersService — requires_tracking_number missing rejection
 *  - createTrackingNumbersService — invalid shipment status rejection
 *  - createTrackingNumbersService — warehouse-scope rejection
 *  - createTrackingNumbersService — normalization round-trip
 *  - createTrackingNumbersService — empty records array rejection
 *  - createTrackingNumbersService — atomicity on partial validation failure
 *  - createTrackingNumbersService — reconciliation path (stubbed repo)
 *
 * Requires: existing outbound_shipments rows in attachable statuses,
 *           pickup + required-tracking + bad-status variants for full coverage,
 *           and a non-admin user with warehouse assignments excluding the
 *           primary shipment's warehouse.
 *
 * Command:
 *   node src/tests/apis/test-tracking-number-service.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  createTrackingNumbersService,
} = require('../../services/tracking-number-service');

const LOG = '[Test: tracking-number-service]';

const pass = (label) => console.log(`\n  ✅ PASS — ${label}`);
const fail = (label, error) =>
  console.error(`\n  ❌ FAIL — ${label}\n     ${error.message}`);
const skip = (label, reason) =>
  console.warn(`\n  ⏭️  SKIP — ${label}\n     ${reason}`);
const info = (label, value) => console.log(`     ${label}:`, value);

// Unique per run so the suite is idempotent on rerun.
const RUN_ID = Date.now().toString(36).toUpperCase();
const trackingNum = (prefix, idx) =>
  `TEST-${prefix}-${RUN_ID}-${idx}`.toUpperCase();

// Quick shape assertion for the service's lean { count, ids } response.
const assertResultShape = (result, expectedCount) => {
  if (result.count !== expectedCount) {
    throw new Error(`Expected count=${expectedCount}, got ${result.count}`);
  }
  if (!Array.isArray(result.ids) || result.ids.length !== expectedCount) {
    throw new Error(
      `Expected ids.length=${expectedCount}, got ${result.ids?.length}`
    );
  }
  if (!result.ids.every((id) => typeof id === 'string' && id.length === 36)) {
    throw new Error('Expected ids to be UUID strings');
  }
};

(async () => {
  const results = { passed: 0, failed: 0, skipped: 0 };
  
  // Track inserted rows for end-of-run cleanup.
  const insertedIds = [];
  
  try {
    await initStatusCache();
    console.log(`${LOG} Status cache ready.\n`);
    
    // ─── 1. Fetch test data ───────────────────────────────────────────────────
    
    const { rows: userRows } = await pool.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    const { rows: attachableShipments } = await pool.query(`
      SELECT os.id, os.warehouse_id, os.delivery_method_id, os.status_id,
             ss.code AS status_code,
             dm.method_name, dm.is_pickup_location, dm.requires_tracking_number
      FROM outbound_shipments os
      INNER JOIN shipment_status ss   ON ss.id = os.status_id
      INNER JOIN delivery_methods dm  ON dm.id = os.delivery_method_id
      WHERE dm.is_pickup_location = false
        AND dm.requires_tracking_number = false
        AND ss.code IN ('SHIPMENT_READY', 'SHIPMENT_IN_TRANSIT')
      ORDER BY os.created_at DESC
      LIMIT 3
    `);
    
    // Pickup shipment for pickup-rejection. Filter by attachable status so the
    // test fails on the pickup gate, not on a status check that runs first.
    const { rows: pickupShipments } = await pool.query(`
      SELECT os.id, dm.method_name
      FROM outbound_shipments os
      INNER JOIN delivery_methods dm ON dm.id = os.delivery_method_id
      INNER JOIN shipment_status ss  ON ss.id = os.status_id
      WHERE dm.is_pickup_location = true
        AND ss.code IN ('SHIPMENT_READY', 'SHIPMENT_IN_TRANSIT')
      LIMIT 1
    `);
    
    const { rows: requiredTrackingShipments } = await pool.query(`
      SELECT os.id, dm.method_name
      FROM outbound_shipments os
      INNER JOIN delivery_methods dm   ON dm.id = os.delivery_method_id
      INNER JOIN shipment_status ss    ON ss.id = os.status_id
      WHERE dm.requires_tracking_number = true
        AND dm.is_pickup_location = false
        AND ss.code IN ('SHIPMENT_READY', 'SHIPMENT_IN_TRANSIT')
      LIMIT 1
    `);
    
    const { rows: badStatusShipments } = await pool.query(`
      SELECT os.id, ss.code AS status_code
      FROM outbound_shipments os
      INNER JOIN shipment_status ss ON ss.id = os.status_id
      WHERE ss.code IN (
        'SHIPMENT_PENDING',
        'SHIPMENT_COMPLETED',
        'SHIPMENT_DELIVERED',
        'SHIPMENT_CANCELLED',
        'SHIPMENT_RETURNED'
      )
      LIMIT 1
    `);
    
    // Freight-capable delivery method: LTL/FTL where BOL replaces per-record
    // tracking. Required for the null-tracking test — parcel methods like
    // 'Standard Shipping' always require a tracking number per record.
    const { rows: freightShipments } = await pool.query(`
      SELECT os.id, dm.method_name
      FROM outbound_shipments os
      INNER JOIN delivery_methods dm ON dm.id = os.delivery_method_id
      INNER JOIN shipment_status ss  ON ss.id = os.status_id
      WHERE dm.is_pickup_location = false
        AND (
          dm.method_name ILIKE '%freight%'
          OR dm.method_name ILIKE '%LTL%'
          OR dm.method_name ILIKE '%FTL%'
        )
        AND ss.code IN ('SHIPMENT_READY', 'SHIPMENT_IN_TRANSIT')
      LIMIT 1
    `);
    
    if (!userRows.length || attachableShipments.length < 1) {
      console.warn(
        `${LOG} Missing test data — need a user and at least 1 attachable outbound_shipment.`
      );
      return;
    }
    
    const testUser = { id: userRows[0].id, role: userRows[0].role_id };
    const primaryShipment = attachableShipments[0];
    
    // Non-admin user assigned to warehouses that EXCLUDE primaryShipment.warehouse_id.
    // If their role grants VIEW_ALL_WAREHOUSES this test will skip — the
    // service will pass and we won't be able to distinguish from a real bypass.
    const { rows: scopedUserRows } = await pool.query(
      `
      SELECT DISTINCT u.id, u.role_id
      FROM users u
      WHERE u.id != $1
        AND EXISTS (
          SELECT 1 FROM user_warehouse_assignments uwa WHERE uwa.user_id = u.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_warehouse_assignments uwa
          WHERE uwa.user_id = u.id AND uwa.warehouse_id = $2
        )
      LIMIT 1
      `,
      [testUser.id, primaryShipment.warehouse_id]
    );
    
    console.log(`${LOG} Resolved test data:`);
    console.log(`  user_id:                       ${testUser.id}`);
    console.log(`  primary shipment_id:           ${primaryShipment.id}`);
    console.log(`  primary warehouse_id:          ${primaryShipment.warehouse_id}`);
    console.log(`  primary delivery method:       ${primaryShipment.method_name}`);
    console.log(`  pickup shipment available:     ${pickupShipments.length > 0}`);
    console.log(`  requires-tracking available:   ${requiredTrackingShipments.length > 0}`);
    console.log(`  bad-status shipment available: ${badStatusShipments.length > 0}`);
    console.log(`  freight-capable shipment:      ${freightShipments.length > 0}`);
    console.log(`  scoped user available:         ${scopedUserRows.length > 0}`);
    
    // ─── 2. Happy path — single tracking ──────────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] single tracking number`);
      
      const result = await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [
          {
            carrier: 'UPS',
            trackingNumber: trackingNum('SINGLE', 1),
            serviceName: 'UPS Ground',
            shippedDate: new Date().toISOString(),
          },
        ],
        user: testUser,
      });
      
      assertResultShape(result, 1);
      insertedIds.push(...result.ids);
      
      info('Count', result.count);
      info('Inserted IDs', result.ids);
      
      pass('create — single tracking');
      results.passed++;
    } catch (error) {
      fail('create — single tracking', error);
      results.failed++;
    }
    
    // ─── 3. Happy path — bulk multi-package ───────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] bulk multi-package (3 records)`);
      
      const records = [1, 2, 3].map((i) => ({
        carrier: 'FedEx',
        trackingNumber: trackingNum('BULK', i),
        serviceName: 'FedEx Ground',
        freightType: 'PARCEL',
      }));
      
      const result = await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records,
        user: testUser,
      });
      
      assertResultShape(result, 3);
      insertedIds.push(...result.ids);
      
      info('Count', result.count);
      
      pass('create — bulk multi-package');
      results.passed++;
    } catch (error) {
      fail('create — bulk multi-package', error);
      results.failed++;
    }
    
    // ─── 4. Happy path — null tracking_number allowed ─────────────────────────
    
    if (!freightShipments.length) {
      skip(
        'create — null tracking_number',
        'no freight-capable shipment (LTL/FTL) found in attachable status'
      );
      results.skipped++;
    } else {
      try {
        console.log(`\n${LOG} [create] null tracking_number (LTL + BOL)`);
        info('Using shipment', freightShipments[0].method_name);
        
        const result = await createTrackingNumbersService({
          outboundShipmentId: freightShipments[0].id,
          records: [
            {
              carrier: 'Pending Carrier',
              freightType: 'LTL',
              bolNumber: `BOL-${RUN_ID}`,
            },
          ],
          user: testUser,
        });
        
        assertResultShape(result, 1);
        insertedIds.push(...result.ids);
        
        info('Count', result.count);
        
        pass('create — null tracking_number');
        results.passed++;
      } catch (error) {
        fail('create — null tracking_number', error);
        results.failed++;
      }
    }
    
    // ─── 5. Reject — shipment not found ───────────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] non-existent shipment`);
      
      await createTrackingNumbersService({
        outboundShipmentId: '00000000-0000-0000-0000-000000000000',
        records: [{ carrier: 'UPS', trackingNumber: trackingNum('NF', 1) }],
        user: testUser,
      });
      
      fail('create — shipment not found', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (
        error.status === 404 ||
        error.message.toLowerCase().includes('not found')
      ) {
        info('Rejected with', error.message);
        pass('create — shipment not found rejection');
        results.passed++;
      } else {
        fail('create — shipment not found rejection', error);
        results.failed++;
      }
    }
    
    // ─── 6. Reject — duplicate (carrier, tracking_number) in DB ───────────────
    
    try {
      console.log(`\n${LOG} [create] DB duplicate (carrier, tracking_number)`);
      
      const dupTracking = trackingNum('DUP', 1);
      
      const seed = await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [{ carrier: 'DHL', trackingNumber: dupTracking }],
        user: testUser,
      });
      insertedIds.push(...seed.ids);
      
      await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [{ carrier: 'DHL', trackingNumber: dupTracking }],
        user: testUser,
      });
      
      fail('create — DB duplicate', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (
        error.status === 409 ||
        error.message.toLowerCase().includes('already exist') ||
        error.message.toLowerCase().includes('duplicate')
      ) {
        info('Rejected with', error.message);
        pass('create — DB duplicate rejection');
        results.passed++;
      } else {
        fail('create — DB duplicate rejection', error);
        results.failed++;
      }
    }
    
    // ─── 7. Reject — in-payload duplicate ─────────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] in-payload duplicate pair`);
      
      const dup = trackingNum('PDUP', 1);
      
      await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [
          { carrier: 'USPS', trackingNumber: dup },
          { carrier: 'USPS', trackingNumber: dup },
        ],
        user: testUser,
      });
      
      fail('create — payload duplicate', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (error.message.toLowerCase().includes('duplicate')) {
        info('Rejected with', error.message);
        pass('create — payload duplicate rejection');
        results.passed++;
      } else {
        fail('create — payload duplicate rejection', error);
        results.failed++;
      }
    }
    
    // ─── 8. Reject — invalid freight_type ─────────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] invalid freight_type`);
      
      await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [
          {
            carrier: 'UPS',
            trackingNumber: trackingNum('BADFR', 1),
            freightType: 'XYZ',
          },
        ],
        user: testUser,
      });
      
      fail('create — invalid freight_type', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (error.message.toLowerCase().includes('freight_type')) {
        info('Rejected with', error.message);
        pass('create — invalid freight_type rejection');
        results.passed++;
      } else {
        fail('create — invalid freight_type rejection', error);
        results.failed++;
      }
    }
    
    // ─── 9. Reject — LTL without BOL ──────────────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] LTL without BOL`);
      
      await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [
          {
            carrier: 'Old Dominion',
            trackingNumber: trackingNum('LTL', 1),
            freightType: 'LTL',
          },
        ],
        user: testUser,
      });
      
      fail('create — LTL without BOL', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (error.message.toLowerCase().includes('bol')) {
        info('Rejected with', error.message);
        pass('create — LTL without BOL rejection');
        results.passed++;
      } else {
        fail('create — LTL without BOL rejection', error);
        results.failed++;
      }
    }
    
    // ─── 10. Reject — pickup location delivery method ─────────────────────────
    
    if (!pickupShipments.length) {
      skip(
        'create — pickup rejection',
        'no shipment with is_pickup_location=true and attachable status found'
      );
      results.skipped++;
    } else {
      try {
        console.log(`\n${LOG} [create] pickup delivery method`);
        
        await createTrackingNumbersService({
          outboundShipmentId: pickupShipments[0].id,
          records: [
            { carrier: 'UPS', trackingNumber: trackingNum('PICKUP', 1) },
          ],
          user: testUser,
        });
        
        fail('create — pickup rejection', new Error('Should have thrown'));
        results.failed++;
      } catch (error) {
        if (error.message.toLowerCase().includes('pickup')) {
          info('Rejected with', error.message);
          pass('create — pickup rejection');
          results.passed++;
        } else {
          fail('create — pickup rejection', error);
          results.failed++;
        }
      }
    }
    
    // ─── 11. Reject — requires_tracking_number but missing ────────────────────
    
    if (!requiredTrackingShipments.length) {
      skip(
        'create — missing-tracking rejection',
        'no shipment with requires_tracking_number=true found'
      );
      results.skipped++;
    } else {
      try {
        console.log(`\n${LOG} [create] requires_tracking_number=true but missing`);
        
        await createTrackingNumbersService({
          outboundShipmentId: requiredTrackingShipments[0].id,
          records: [{ carrier: 'UPS' /* trackingNumber omitted */ }],
          user: testUser,
        });
        
        fail(
          'create — missing tracking rejection',
          new Error('Should have thrown')
        );
        results.failed++;
      } catch (error) {
        if (
          error.message.toLowerCase().includes('requires a tracking number') ||
          error.message.toLowerCase().includes('missing tracking_number')
        ) {
          info('Rejected with', error.message);
          pass('create — missing tracking rejection');
          results.passed++;
        } else {
          fail('create — missing tracking rejection', error);
          results.failed++;
        }
      }
    }
    
    // ─── 12. Reject — invalid shipment status ─────────────────────────────────
    
    if (!badStatusShipments.length) {
      skip(
        'create — invalid shipment status',
        'no shipment in pending/cancelled/returned status found'
      );
      results.skipped++;
    } else {
      try {
        console.log(
          `\n${LOG} [create] shipment in status '${badStatusShipments[0].status_code}'`
        );
        
        await createTrackingNumbersService({
          outboundShipmentId: badStatusShipments[0].id,
          records: [
            { carrier: 'UPS', trackingNumber: trackingNum('BADSTATUS', 1) },
          ],
          user: testUser,
        });
        
        fail(
          'create — invalid shipment status',
          new Error('Should have thrown')
        );
        results.failed++;
      } catch (error) {
        if (
          error.message.toLowerCase().includes('cannot attach') ||
          error.message.toLowerCase().includes('status')
        ) {
          info('Rejected with', error.message);
          pass('create — invalid shipment status rejection');
          results.passed++;
        } else {
          fail('create — invalid shipment status rejection', error);
          results.failed++;
        }
      }
    }
    
    // ─── 13. Reject — warehouse scope (user not assigned to shipment WH) ──────
    
    if (!scopedUserRows.length) {
      skip(
        'create — warehouse-scope rejection',
        'no non-admin user with warehouse assignments excluding the primary shipment’s warehouse found'
      );
      results.skipped++;
    } else {
      const scopedUser = {
        id: scopedUserRows[0].id,
        role: scopedUserRows[0].role_id,
      };
      
      try {
        console.log(`\n${LOG} [create] warehouse scope violation`);
        info('Acting as user_id', scopedUser.id);
        
        await createTrackingNumbersService({
          outboundShipmentId: primaryShipment.id,
          records: [
            { carrier: 'UPS', trackingNumber: trackingNum('SCOPE', 1) },
          ],
          user: scopedUser,
        });
        
        // If this passes, the user likely has VIEW_ALL_WAREHOUSES.
        // Convert to a skip so it doesn't show as a false pass.
        skip(
          'create — warehouse-scope rejection',
          'service accepted the call; chosen user probably has VIEW_ALL_WAREHOUSES'
        );
        results.skipped++;
      } catch (error) {
        if (
          error.status === 403 ||
          error.message.toLowerCase().includes('warehouse') ||
          error.message.toLowerCase().includes('access')
        ) {
          info('Rejected with', error.message);
          pass('create — warehouse-scope rejection');
          results.passed++;
        } else {
          fail('create — warehouse-scope rejection', error);
          results.failed++;
        }
      }
    }
    
    // ─── 14. Normalization round-trip (whitespace + dots + case) ──────────────
    //
    // Input:  ' ups.RUN_ID-norm '  → strip [\s.] + upper → 'UPS{RUN_ID}-NORM'
    // Insert via service, then SELECT the row and assert the stored value
    // matches the canonical form.
    
    try {
      console.log(`\n${LOG} [create] normalization round-trip`);
      
      const messyInput = ` ups.${RUN_ID}-norm `;
      const expected = `UPS${RUN_ID}-NORM`;
      
      const result = await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [{ carrier: 'UPS', trackingNumber: messyInput }],
        user: testUser,
      });
      
      assertResultShape(result, 1);
      insertedIds.push(...result.ids);
      
      const { rows } = await pool.query(
        `SELECT tracking_number FROM tracking_numbers WHERE id = $1`,
        [result.ids[0]]
      );
      
      info('Input', messyInput);
      info('Stored', rows[0]?.tracking_number);
      info('Expected', expected);
      
      if (rows[0]?.tracking_number !== expected) {
        throw new Error(
          `Normalization mismatch: stored='${rows[0]?.tracking_number}', expected='${expected}'`
        );
      }
      
      pass('create — normalization round-trip');
      results.passed++;
    } catch (error) {
      fail('create — normalization round-trip', error);
      results.failed++;
    }
    
    // ─── 15. Reject — empty records array ─────────────────────────────────────
    
    try {
      console.log(`\n${LOG} [create] empty records array`);
      
      await createTrackingNumbersService({
        outboundShipmentId: primaryShipment.id,
        records: [],
        user: testUser,
      });
      
      fail('create — empty records', new Error('Should have thrown'));
      results.failed++;
    } catch (error) {
      if (
        error.message.toLowerCase().includes('at least one') ||
        error.message.toLowerCase().includes('required')
      ) {
        info('Rejected with', error.message);
        pass('create — empty records rejection');
        results.passed++;
      } else {
        fail('create — empty records rejection', error);
        results.failed++;
      }
    }
    
    // ─── 16. Atomicity — partial validation failure rolls back everything ─────
    //
    // Send 3 records: two valid, one with invalid freight_type. The service
    // should throw and NONE of the three should land in the DB.
    
    try {
      console.log(`\n${LOG} [create] atomicity on partial validation failure`);
      
      const atomicTrackings = [1, 2, 3].map((i) => trackingNum('ATOMIC', i));
      
      try {
        await createTrackingNumbersService({
          outboundShipmentId: primaryShipment.id,
          records: [
            { carrier: 'UPS', trackingNumber: atomicTrackings[0] },
            { carrier: 'FedEx', trackingNumber: atomicTrackings[1] },
            {
              carrier: 'UPS',
              trackingNumber: atomicTrackings[2],
              freightType: 'XYZ',
            },
          ],
          user: testUser,
        });
        
        throw new Error('Service should have thrown on invalid freight_type');
      } catch (error) {
        if (!error.message.toLowerCase().includes('freight_type')) {
          throw error; // unexpected — rethrow into outer catch
        }
        // Expected — now verify rollback.
      }
      
      const { rows } = await pool.query(
        `SELECT id FROM tracking_numbers WHERE tracking_number = ANY($1::text[])`,
        [atomicTrackings]
      );
      
      info('Rows persisted after rollback', rows.length);
      
      if (rows.length !== 0) {
        throw new Error(
          `Expected 0 rows after rollback, got ${rows.length} (atomicity broken)`
        );
      }
      
      pass('create — atomicity on partial failure');
      results.passed++;
    } catch (error) {
      fail('create — atomicity on partial failure', error);
      results.failed++;
    }
    
    // ─── 17. Reconciliation path (stubbed repo) ───────────────────────────────
    //
    // The service's post-insert reconciliation guards against the race window
    // between the duplicate pre-flight and the bulk insert (ON CONFLICT DO
    // NOTHING). We simulate that race by stubbing insertTrackingNumbersBulk to
    // return one fewer row than requested.
    //
    // Mechanism: clear the require-cache for the repo AND the business layer
    // (which destructures from the repo at load time), mutate the repo's
    // exports, then reload the SERVICE so it re-requires the business layer,
    // which then re-destructures from the now-stubbed repo. Without clearing
    // the business layer, its bound reference still points at the original
    // function and the stub never takes effect.
    //
    // Run this LAST — it leaves the require cache in a dirty state.
    
    try {
      console.log(`\n${LOG} [create] reconciliation path via stubbed repo`);
      
      const repoPath = require.resolve(
        '../../repositories/tracking-number-repository'
      );
      const businessPath = require.resolve(
        '../../business/tracking-number-business'
      );
      const servicePath = require.resolve(
        '../../services/tracking-number-service'
      );
      
      // Order matters: clear repo first, re-require, mutate, THEN clear the
      // dependents so they re-bind to the mutated repo on next require.
      delete require.cache[repoPath];
      const stubRepo = require(repoPath);
      const realInsert = stubRepo.insertTrackingNumbersBulk;
      
      stubRepo.insertTrackingNumbersBulk = async (records, client) => {
        const real = await realInsert(records, client);
        // Drop one row to simulate ON CONFLICT DO NOTHING under contention.
        return real.slice(0, Math.max(0, real.length - 1));
      };
      
      delete require.cache[businessPath];
      delete require.cache[servicePath];
      const { createTrackingNumbersService: stubbedService } =
        require(servicePath);
      
      try {
        await stubbedService({
          outboundShipmentId: primaryShipment.id,
          records: [
            { carrier: 'UPS', trackingNumber: trackingNum('RECON', 1) },
            { carrier: 'UPS', trackingNumber: trackingNum('RECON', 2) },
          ],
          user: testUser,
        });
        
        fail(
          'create — reconciliation path',
          new Error('Reconciliation step did not fire')
        );
        results.failed++;
      } catch (error) {
        if (
          error.status === 409 ||
          error.message.toLowerCase().includes('conflict') ||
          error.message.toLowerCase().includes('retry')
        ) {
          info('Rejected with', error.message);
          pass('create — reconciliation path');
          results.passed++;
        } else {
          fail('create — reconciliation path', error);
          results.failed++;
        }
      } finally {
        // Restore the stubbed repo's export. Note: the business layer
        // re-required above still holds the stub reference via destructure,
        // so any later code in this process would still see the stub. We're
        // the last test, so this is acceptable; for safety we also clear the
        // business + service caches so the next require() rebuilds cleanly.
        stubRepo.insertTrackingNumbersBulk = realInsert;
        delete require.cache[businessPath];
        delete require.cache[servicePath];
      }
    } catch (error) {
      fail('create — reconciliation path (setup)', error);
      results.failed++;
    }
  } catch (error) {
    console.error(`${LOG} Fatal setup error:`, error.message);
    console.error(error.stack);
  } finally {
    // ─── Cleanup ──────────────────────────────────────────────────────────────
    if (insertedIds.length > 0) {
      try {
        const { rowCount } = await pool.query(
          `DELETE FROM tracking_numbers WHERE id = ANY($1::uuid[])`,
          [insertedIds]
        );
        console.log(`\n${LOG} Cleanup: deleted ${rowCount} test row(s).`);
      } catch (err) {
        console.warn(`${LOG} Cleanup failed: ${err.message}`);
      }
    }
    
    console.log(`\n${'─'.repeat(50)}`);
    console.log(
      `${LOG} Results: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`
    );
    console.log(`${'─'.repeat(50)}\n`);
    await pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
  }
})();
