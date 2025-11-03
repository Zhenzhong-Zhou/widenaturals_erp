const { pool } = require('../../database/db');
const { getSkuLookup } = require('../../repositories/sku-repository');
const { initStatusCache, getStatusId } = require('../../config/status-cache');
const {
  fetchPaginatedSkuLookupService,
} = require('../../services/lookup-service');

(async () => {
  const client = await pool.connect();

  await initStatusCache();

  const { rows } = await client.query(
    `
      SELECT id, role_id FROM users WHERE email = $1
    `,
    // ['root@widenaturals.com']
    ['jp@widenaturals.com']
  );
  const user = rows[0];
  const { id, role_id } = user;
  const enrichedUser = {
    id,
    role: role_id,
  };

  const productStatusId = getStatusId('product_active');
  const batchStatusId = getStatusId('batch_active');
  const inventoryStatusId = getStatusId('inventory_in_stock');

  try {
    const result = await getSkuLookup({
      productStatusId,
      filters: {
        // keyword: 'nmn',
      },
      options: {
        allowAllSkus: false,
        requireAvailableStock: true,
        batchStatusId,
        inventoryStatusId,
      },
      limit: 50,
    });
    console.log('SKU lookup result:', result);

    const serviceResult = await fetchPaginatedSkuLookupService(enrichedUser, {
      filters: {
        // keyword: 'nmn', // your test keyword
        // keyword: 'Algal Oil',
      },
      options: {
        allowAllSkus: false,
        requireAvailableStock: true,
        batchStatusId,
        inventoryStatusId,
      },
      limit: 50,
      offset: 0,
    });
    console.log('SKU lookup service result:', serviceResult);
  } catch (error) {
    console.error('Failed to fetch discount lookup:', error.message);
  } finally {
    client.release();
  }
})();
