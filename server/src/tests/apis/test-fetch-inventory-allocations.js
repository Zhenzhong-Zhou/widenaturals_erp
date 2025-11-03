const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const {
  fetchPaginatedInventoryAllocationsService,
} = require('../../services/inventory-allocation-service');

(async () => {
  const client = await pool.connect();

  try {
    const logContext = '[Test: reviewInventoryAllocation]';

    // Step 1: Fetch test user
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );

    if (rows.length === 0) {
      console.error(`${logContext} User not found.`);
      return;
    }

    const { id: userId, role_id: roleId } = rows[0];
    const enrichedUser = { id: userId, role: roleId };

    // Step 2: Map logical sort key to actual column
    const sortMap = getSortMapForModule('inventoryAllocationSortMap'); // or your actual module key
    const logicalSortKey = 'orderStatus';

    if (!sortMap[logicalSortKey]) {
      throw new Error(`Invalid sort key: ${logicalSortKey}`);
    }

    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;

    // Step 3: Execute service with mapped sort column
    const result = await fetchPaginatedInventoryAllocationsService({
      filters: {},
      page: 1,
      limit: 20,
      sortBy: sortByColumn,
      sortOrder: 'DESC',
    });

    console.log(`${logContext} Review Result:`);
    console.dir(result, { depth: null, colors: true });

    console.log(
      `${logContext} JSON Preview:\n`,
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    console.error(
      '[Test: fetchPaginatedInventoryAllocationsService] Error:',
      error.message
    );
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
