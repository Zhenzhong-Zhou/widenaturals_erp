import batchRegistryLookupReducer from './batchRegistryLookupSlice';
import warehouseLookupReducer from './warehouseLookupSlice';
import lotAdjustmentTypeLookupReducer from './lotAdjustmentTypeLookupSlice';
import customerLookupReducer from './customerLookupSlice';
import addressByCustomerLookupReducer from './addressByCustomerLookupSlice';
import orderTypeLookupReducer from './orderTypeLookupSlice';
import paymentMethodLookupReducer from './paymentMethodLookupSlice';
import discountLookupReducer from './discountLookupSlice';
import taxRateLookupReducer from './taxRateLookupSlice';
import deliveryMethodLookupReducer from './deliveryMethodLookupSlice';
import skuLookupReducer from './skuLookupSlice';
import pricingLookupReducer from './pricingLookupSlice';
import packagingMaterialLookupReducer from './packagingMaterialLookupSlice';
import skuCodeBaseLookupReducer from './skuCodeBaseLookupSlice';
import productLookupReducer from './productLookupSlice';
import statusLookupReducer from './statusLookupSlice';

/**
 * Reducer map for Lookup / Dropdown reference data.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `lookup` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const lookupReducers = {
  batchRegistryLookup: batchRegistryLookupReducer,
  warehouseLookup: warehouseLookupReducer,
  lotAdjustmentTypeLookup: lotAdjustmentTypeLookupReducer,
  customerLookup: customerLookupReducer,
  addressByCustomer: addressByCustomerLookupReducer,
  orderTypeLookup: orderTypeLookupReducer,
  paymentMethodLookup: paymentMethodLookupReducer,
  discountLookup: discountLookupReducer,
  taxRateLookup: taxRateLookupReducer,
  deliveryMethodLookup: deliveryMethodLookupReducer,
  skuLookup: skuLookupReducer,
  pricingLookup: pricingLookupReducer,
  packagingMaterialLookup: packagingMaterialLookupReducer,
  skuCodeBaseLookup: skuCodeBaseLookupReducer,
  productLookup: productLookupReducer,
  statusLookup: statusLookupReducer,
};
