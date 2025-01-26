const { getProducts } = require('../repositories/product-repository');

// Service to handle business logic for getting products
const fetchAllProducts = async ({ page = 1, limit = 10, category, name }) => {
  // Construct filters dynamically
  const filters = {};
  if (category) filters.category = category;
  if (name) filters.name = name;
  
  // Call the repository layer, which handles pagination and retry
  const { data, pagination } = await getProducts({ page, limit, filters });
  
  return {
    data,
    pagination, // Already calculated in the repository layer
  };
};

module.exports = {
  fetchAllProducts,
};
