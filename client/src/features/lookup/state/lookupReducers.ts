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
import userLookupReducer from './userLookupSlice';
import roleLookupReducer from './roleLookupSlice';

/**
 * Reducer map for Lookup / Dropdown reference data.
 *
 * This reducer group is composed into the root reducer
 * under the `lookup` state subtree.
 *
 * Lookup reducers are:
 * - Read-heavy, reference-oriented slices
 * - Used exclusively for dropdowns, selectors, and autocomplete inputs
 * - NOT authoritative domain state
 * - Safe to reset or refresh at any time
 *
 * Design principles:
 * - Slice reducers are imported directly to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Lookup slices are private implementation details and must
 *   not be accessed via feature or state barrel files.
 * - Reducer aggregators must NEVER import feature-level logic.
 * - No domain mutations or side effects belong in lookup slices.
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
  userLookup: userLookupReducer,
  roleLookup: roleLookupReducer,
};
