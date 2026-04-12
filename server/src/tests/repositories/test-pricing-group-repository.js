/**
 * Test Script: Pricing Group Repository Functions
 *
 * Tests:
 *  - getPricingGroupById
 *  - getPricingGroupList
 *
 * Command:
 *   node src/tests/apis/test-pricing-group-repository.js
 */

'use strict';

const { pool }            = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  getPaginatedPricingGroups,
  getPricingGroupById,
} = require('../../repositories/pricing-group-repository');

const LOG = '[Test: pricing-group-repository]';

const pass = (label)        => console.log(`\n  ✅ PASS — ${label}`);
const fail = (label, error) => console.error(`\n  ❌ FAIL — ${label}\n     ${error.message}`);
const info = (label, value) => console.log(`     ${label}:`, value);

(async () => {
  const results = { passed: 0, failed: 0 };
  
  try {
    // ─── 0. Status Cache ──────────────────────────────────────────────────────
    await initStatusCache();
    console.log(`${LOG} Status cache ready.\n`);
    
    // ─── 1. Fetch real IDs from DB ────────────────────────────────────────────
    const { rows: groupRows } = await pool.query(`
      SELECT pg.id AS pricing_group_id, pg.pricing_type_id
      FROM pricing_groups pg
      LIMIT 1
    `);
    
    if (!groupRows.length) {
      console.warn(`${LOG} No pricing groups found — seed data required.`);
      return;
    }
    
    const testPricingGroupId = groupRows[0].pricing_group_id;
    const testPricingTypeId  = groupRows[0].pricing_type_id;
    
    console.log(`${LOG} Resolved test IDs:`);
    console.log(`  pricing_group_id: ${testPricingGroupId}`);
    console.log(`  pricing_type_id:  ${testPricingTypeId}`);
    
    // ─── 2. getPricingGroupById ───────────────────────────────────────────────
    try {
      console.log(`\n${LOG} [getPricingGroupById]`);
      const group = await getPricingGroupById(testPricingGroupId);
      if (!group) {
        console.warn(`${LOG} [getPricingGroupById] No group found.`);
      } else {
        console.dir(group, { depth: null, colors: true });
      }
      pass('getPricingGroupById');
      results.passed++;
    } catch (error) {
      fail('getPricingGroupById', error);
      results.failed++;
    }
    
    // ─── 3. getPricingGroupList — pricingTypeId filter ────────────────────────
    try {
      console.log(`\n${LOG} [getPricingGroupList] pricingTypeId filter`);
      const result = await getPricingGroupList({
        filters: { pricingTypeId: testPricingTypeId },
        page:    1,
        limit:   5,
      });
      info('Total records', result.pagination.totalRecords);
      console.dir(result.data, { depth: null, colors: true });
      pass('getPricingGroupList — pricingTypeId filter');
      results.passed++;
    } catch (error) {
      fail('getPricingGroupList — pricingTypeId filter', error);
      results.failed++;
    }
    
    // ─── 3a. getPaginatedPricingGroups — no filters ─────────────────────────────────
    try {
      console.log(`\n${LOG} [getPaginatedPricingGroups] no filters`);
      const result = await getPaginatedPricingGroups({ page: 1, limit: 5 });
      info('Total records', result.pagination.totalRecords);
      console.dir(result.data, { depth: null, colors: true });
      pass('getPaginatedPricingGroups — no filters');
      results.passed++;
    } catch (error) {
      fail('getPaginatedPricingGroups — no filters', error);
      results.failed++;
    }
    
  } catch (error) {
    console.error(`${LOG} Fatal setup error:`, error.message);
    console.error(error.stack);
  } finally {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${LOG} Results: ${results.passed} passed, ${results.failed} failed`);
    console.log(`${'─'.repeat(50)}\n`);
    await pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
  }
})();
