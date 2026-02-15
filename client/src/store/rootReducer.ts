/**
 * Root Redux reducer.
 *
 * Architecture overview:
 * - Runtime state contains all server-authoritative and security-sensitive data
 *   (authentication, session, permissions, domain data).
 * - Persisted state contains UX-only preferences (e.g. theme).
 *
 * Authentication model:
 * - Authentication is NOT persisted in Redux or localStorage.
 * - Access tokens live in memory only.
 * - Session continuity across page reloads is restored via an
 *   explicit bootstrap refresh-token flow.
 *
 * Logout semantics:
 * - Dispatching `auth/logout` resets all runtime state immediately.
 * - Persisted UX state is preserved.
 *
 * Security guarantees:
 * - No credentials or permissions are ever stored in persistent storage.
 * - A page reload always starts from a known unauthenticated runtime state
 *   until the bootstrap refresh-token flow completes.
 */

import { combineReducers, type PayloadAction } from '@reduxjs/toolkit';
import { persistedReducer } from './persistedReducer';

// ===== Import reducer MAPS =====
import { authorizeReducers } from '@features/authorize';
import { sessionReducers } from '@features/session';
import { csrfReducers } from '@features/csrf';
import { authReducers } from '@features/auth/password';
import { userReducers } from '@features/user';

import { addressReducers } from '@features/address';
import { complianceRecordReducers } from '@features/complianceRecord';
import { customerReducers } from '@features/customer';
import { deliveryMethodReducers } from '@features/deliveryMethod';
import { discountReducers } from '@features/discount';
import { systemHealthReducers } from '@features/systemHealth';
import { locationInventoryReducers } from '@features/locationInventory';
import { locationReducers } from '@features/location';
import { locationTypeReducers } from '@features/locationType';
import { orderReducers } from '@features/order';
import { orderTypeReducers } from '@features/orderType';
import { pricingReducers } from '@features/pricing';
import { pricingTypeReducers } from '@features/pricingType';
import { productReducers } from '@features/product';
import { skuReducers } from '@features/sku';
import { bomReducers } from '@features/bom';
import { reportReducers } from '@features/report';
import { lookupReducers } from '@features/lookup';
import { taxRateReducers } from '@features/taxRate';
import { warehouseReducers } from '@features/warehouse';
import { warehouseInventoryReducers } from '@features/warehouseInventory';
import { inventoryAllocationReducers } from '@features/inventoryAllocation';
import { outboundFulfillmentReducers } from '@features/outboundFulfillment';
import { skuImageReducers } from '@features/skuImage';
import { batchRegistryReducers } from '@features/batchRegistry';
import { productBatchReducers } from '@features/productBatch';

// ===== Runtime reducer (flattened maps) =====
const runtimeReducer = combineReducers({
  // Auth / identity (runtime only)
  ...authorizeReducers,
  ...sessionReducers,
  ...csrfReducers,
  ...authReducers,
  ...userReducers,

  // Product & Pricing
  ...productReducers,
  ...skuReducers,
  ...skuImageReducers,
  ...complianceRecordReducers,
  ...bomReducers,
  ...pricingTypeReducers,
  ...pricingReducers,

  // Batch
  ...batchRegistryReducers,
  ...productBatchReducers,

  // Inventory & Warehouse
  ...locationTypeReducers,
  ...locationReducers,
  ...locationInventoryReducers,
  ...warehouseReducers,
  ...warehouseInventoryReducers,

  // Orders & Process
  ...customerReducers,
  ...addressReducers,
  ...orderTypeReducers,
  ...orderReducers,
  ...inventoryAllocationReducers,
  ...outboundFulfillmentReducers,

  // Reporting & Misc
  ...reportReducers,
  ...lookupReducers,
  ...discountReducers,
  ...taxRateReducers,
  ...deliveryMethodReducers,
  ...systemHealthReducers,
});

// ===== App reducer =====
const appReducer = combineReducers({
  runtime: runtimeReducer,
  persisted: persistedReducer,
});

// ===== Root reducer with logout reset =====
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: PayloadAction<any>
) => {
  if (action.type === 'auth/logout') {
    // Full runtime reset; UX state remains persisted
    console.info('Resetting runtime state on logout');
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

export default rootReducer;
