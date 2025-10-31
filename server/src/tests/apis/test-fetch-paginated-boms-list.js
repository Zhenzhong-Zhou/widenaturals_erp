/**
 * @fileoverview
 * Test script to fetch and print paginated BOM records with product/SKU info.
 * Adjust email, filters, and pagination options as needed.
 *
 * Run with:
 *   node server/src/tests/apis/test-paginated-boms.js
 */

const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');
const { fetchPaginatedBomsService } = require('../../services/bom-service');

(async () => {
  const startTime = performance.now();
  const logPrefix = '[Test: Paginated BOMs]';
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting test...`);
    
    // Step 1: Connect to DB
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    // Step 2: Fetch test user (adjust email if needed)
    const {
      rows: [user],
    } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1`,
      ['root@widenaturals.com']
    );
    
    if (!user) {
      throw new Error('❌ No test user found for the given email.');
    }
    
    const testUser = { id: user.id, roleId: user.role_id };
    console.log(`${logPrefix} 👤 Using test user:`, testUser);
    
    // Step 3: Define test parameters
    const filters = {
      // Example filters (uncomment as needed)
      // keyword: 'Capsule',
      // isActive: true,
      // statusId: 'some-status-uuid',
      // skuCode: 'PG-TCM300-R-CN',
      // createdAfter: '2024-01-01',
    };
    
    const page = 1;
    const limit = 20;
    const sort = SORTABLE_FIELDS.bomSortMap.defaultNaturalSort;
    
    // Step 4: Run repository function
    console.log(`${logPrefix} ▶️ Fetching paginated BOMs...`);
    const result = await fetchPaginatedBomsService({
      filters,
      page,
      limit,
      sortBy: sort, // directly pass the SQL snippet
      sortOrder: null,
    });
    
    // Step 5: Print results
    console.log(`${logPrefix} ✅ Query completed successfully.`);
    console.log(`${logPrefix} 📦 Retrieved ${result.data.length} BOM(s)`);
    
    console.dir(result, { depth: null, colors: true });
    
    console.table(
      result.data.map((r) => ({
        Product: r.product?.name ?? '—',
        SKU: r.sku?.code ?? '—',
        BOM_Code: r.bom?.code ?? '—',
        Revision: r.bom?.revision ?? '—',
        Active: r.bom?.isActive ? 'Yes' : '—',
        Default: r.bom?.isDefault ? 'Yes' : '—',
        
        // 🧾 Compliance summary (optional)
        Compliance_Type: r.sku?.compliance?.type ?? '—',
        Compliance_Number: r.sku?.compliance?.number ?? '—',
        
        // 🕓 Audit info
        UpdatedAt: r.bom?.audit?.updatedAt
          ? new Date(r.bom.audit.updatedAt).toLocaleString()
          : new Date(r.bom.audit.createdAt).toLocaleString(),
        UpdatedBy:
          r.bom?.audit?.updatedBy?.name ??
          r.bom?.audit?.createdBy?.name ??
          'System',
      }))
    );
    
    console.log(`${logPrefix} 📄 Pagination Info:`);
    console.log(result.pagination);
    
    // Step 6: Summary timing
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} ⏱ Completed in ${elapsed}s.`);
  } catch (error) {
    console.error(`${logPrefix} ❌ Error occurred:`, error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 Database connection closed.`);
  }
})();
