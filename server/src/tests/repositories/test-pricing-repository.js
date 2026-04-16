/**
 * Test Script: Pricing Repository Functions
 *
 * Tests:
 *  - getPricingBySkuId
 *  - getSkusByGroupId
 *  - exportAllPricingRecords
 *
 * Command:
 *   node src/tests/apis/test-pricing-repository.js
 */

'use strict';

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  getPricingBySkuId,
  getSkusByGroupId,
  exportAllPricingRecords,
} = require('../../repositories/pricing-repository');

const LOG = '[Test: pricing-repository]';

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
    const { rows: pricingRows } = await pool.query(`
      SELECT p.sku_id, p.pricing_group_id, pg.pricing_type_id
      FROM pricing p
      JOIN pricing_groups pg ON pg.id = p.pricing_group_id
      LIMIT 1
    `);

    if (!pricingRows.length) {
      console.warn(`${LOG} No pricing rows found — seed data required.`);
      return;
    }

    const testSkuId = pricingRows[0].sku_id;
    const testPricingGroupId = pricingRows[0].pricing_group_id;
    const testPricingTypeId = pricingRows[0].pricing_type_id;

    console.log(`${LOG} Resolved test IDs:`);
    console.log(`  sku_id:           ${testSkuId}`);
    console.log(`  pricing_group_id: ${testPricingGroupId}`);
    console.log(`  pricing_type_id:  ${testPricingTypeId}`);

    // ─── 2. getPricingBySkuId ─────────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [getPricingBySkuId]`);
      const rows = await getPricingBySkuId(testSkuId);
      info('Row count', rows.length);
      console.dir(rows, { depth: null, colors: true });
      pass('getPricingBySkuId');
      results.passed++;
    } catch (error) {
      fail('getPricingBySkuId', error);
      results.failed++;
    }

    // ─── 3. getSkusByGroupId — no filters ────────────────────────────────────
    try {
      console.log(`\n${LOG} [getSkusByGroupId] no filters`);
      const result = await getSkusByGroupId({
        pricingGroupId: testPricingGroupId,
        filters: {},
        page: 1,
        limit: 5,
      });
      info('Total records', result.pagination.totalRecords);
      console.dir(result.data, { depth: null, colors: true });
      pass('getSkusByGroupId — no filters');
      results.passed++;
    } catch (error) {
      fail('getSkusByGroupId — no filters', error);
      results.failed++;
    }

    // ─── 3a. getSkusByGroupId — search filter ────────────────────────────────
    try {
      console.log(`\n${LOG} [getSkusByGroupId] search filter`);
      const result = await getSkusByGroupId({
        pricingGroupId: testPricingGroupId,
        filters: { search: 'Health' },
        page: 1,
        limit: 5,
      });
      info('Row count', result.data.length);
      console.dir(result.data, { depth: null, colors: true });
      pass('getSkusByGroupId — search filter');
      results.passed++;
    } catch (error) {
      fail('getSkusByGroupId — search filter', error);
      results.failed++;
    }

    // ─── 4. exportAllPricingRecords — no filters ──────────────────────────────
    try {
      console.log(`\n${LOG} [exportAllPricingRecords] no filters`);
      const rows = await exportAllPricingRecords({});
      info('Row count', rows.length);
      console.dir(rows.slice(0, 3), { depth: null, colors: true });
      pass('exportAllPricingRecords — no filters');
      results.passed++;
    } catch (error) {
      fail('exportAllPricingRecords — no filters', error);
      results.failed++;
    }

    // ─── 4a. exportAllPricingRecords — pricingTypeId filter ───────────────────
    try {
      console.log(`\n${LOG} [exportAllPricingRecords] pricingTypeId filter`);
      const rows = await exportAllPricingRecords({
        filters: { pricingTypeId: testPricingTypeId },
      });
      info('Row count', rows.length);
      console.dir(rows.slice(0, 3), { depth: null, colors: true });
      pass('exportAllPricingRecords — pricingTypeId filter');
      results.passed++;
    } catch (error) {
      fail('exportAllPricingRecords — pricingTypeId filter', error);
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
