/**
 * Maps frontend filter keys to fully qualified SQL fields,
 * organized by table/module for reuse across service and repository layers.
 */
const FILTERABLE_FIELDS = {
  skuProductCards: {
    brand: 'p.brand',
    category: 'p.category',
    marketRegion: 'sku.market_region',
    sizeLabel: 'sku.size_label',
    keyword: 'p.name',
  },
};

module.exports = {
  FILTERABLE_FIELDS,
};
