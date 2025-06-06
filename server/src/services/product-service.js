const {
  getAvailableProductsForDropdown,
  getProductsForDropdown,
} = require('../repositories/product-repository');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

const fetchProductDropdownList = async (warehouse_id) => {
  try {
    return await getAvailableProductsForDropdown(warehouse_id);
  } catch (error) {
    throw AppError.serviceError(
      `Failed to fetch product dropdown: ${error.message}`
    );
  }
};

/**
 * Fetches available products for the dropdown menu.
 * Applies business logic for formatting results.
 *
 * @param {string|null} search - Optional search term for filtering (product name, SKU, or barcode).
 * @param {number} limit - Maximum number of results to fetch (Default: 100).
 * @returns {Promise<Array<{ id: string, label: string }>>}
 */
const fetchAvailableProductsForDropdown = async (
  search = null,
  limit = 100
) => {
  try {
    const products = await getProductsForDropdown(search, limit);

    // Apply business logic (e.g., formatting label with SKU and barcode if needed)
    return products.map((product) => ({
      id: product.id,
      label: `${product.label}`, // Optionally include SKU or barcode if required
    }));
  } catch (error) {
    logError('Error fetching products for dropdown (Service Layer):', error);
    throw AppError.serviceError('Failed to fetch products for dropdown');
  }
};

module.exports = {
  fetchProductDropdownList,
  fetchAvailableProductsForDropdown,
};
