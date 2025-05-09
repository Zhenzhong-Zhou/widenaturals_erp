import { combineReducers, type PayloadAction } from '@reduxjs/toolkit';
import { createReducerMap } from '@utils/reducerUtils';

// Reducer groups
import { authorizeReducers } from '@features/authorize';
import { complianceReducers } from '@features/compliance';
import { csrfReducers } from '@features/csrf';
import { customerReducers } from '@features/customer';
import { deliveryMethodReducers } from '@features/deliveryMethod';
import { discountReducers } from '@features/discount';
import { healthReducers } from '@features/health';
import { inventoryReducers } from '@features/inventory';
import { locationReducers } from '@features/location';
import { locationTypeReducers } from '@features/locationType';
import { orderReducers } from '@features/order';
import { orderTypeReducers } from '@features/orderType';
import { pricingReducers } from '@features/pricing';
import { pricingTypeReducers } from '@features/pricingType';
import { skuReducers } from '@features/product';
import { reportReducers } from '@features/report';
import { resetPasswordReducers } from '@features/resetPassword';
import { sessionReducers } from '@features/session';
import { taxRateReducers } from '@features/taxRate';
import { userReducers } from '@features/user';
import { warehouseReducers } from '@features/warehouse';
import { warehouseInventoryReducers } from '@features/warehouseInventory';
import { inventoryAllocationReducers } from '@features/inventoryAllocation';

// Use helper to combine
const appReducer = combineReducers(
  createReducerMap(
    // Auth
    authorizeReducers,
    sessionReducers,
    csrfReducers,
    resetPasswordReducers,

    // User
    userReducers,
    customerReducers,

    // Product & Pricing
    skuReducers,
    complianceReducers,
    pricingTypeReducers,
    pricingReducers,

    // Inventory & Warehouse
    locationTypeReducers,
    locationReducers,
    inventoryReducers,
    warehouseReducers,
    warehouseInventoryReducers,

    // Orders && Process
    orderTypeReducers,
    orderReducers,
    inventoryAllocationReducers,
    
    // Reporting
    reportReducers,

    // Misc
    discountReducers,
    taxRateReducers,
    deliveryMethodReducers,
    healthReducers
  )
);

// Root reducer with logout handling
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: PayloadAction<any>
) => {
  if (action.type === 'auth/logout') {
    console.info('Resetting state on logout...');
    // Reset the entire state except for specific slices, if needed
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;
