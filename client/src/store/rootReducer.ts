import { combineReducers } from '@reduxjs/toolkit';
import { PayloadAction } from '@reduxjs/toolkit';
import healthReducer from '../features/health/state/healthStatusSlice.ts';
import csrfReducer from '../features/csrf/state/csrfSlice';
import sessionReducer from '../features/session/state/sessionSlice.ts';
import userProfileReducer from '../features/user/state/userProfileSlice.ts';
import resetPasswordReducer from '../features/resetPassword/state/resetPasswordSlice.ts';
import usersReducer from '../features/user/state/userSlice.ts';
import permissionsReducer from '../features/authorize/state/permissionSlice.ts';
import productsReducer from '../features/product/state/productSlice.ts';
import productReducer from '../features/product/state/productDetailSlice.ts';
import pricingTypesReducer from '../features/pricingTypes/state/pricingTypeSlice.ts';
import pricingTypeReducer from '../features/pricingTypes/state/pricingTypeDetailSlice.ts';
import pricingsReducer from '../features/pricing/state/pricingSlice.ts';
import pricingReducer from '../features/pricing/state/pricingDetailSlice.ts';
import locationTypesReducer from '../features/locationTypes/state/locationTypesSlice.ts';
import locationTypeReducer from '../features/locationTypes/state/locationTypeDetailSlice.ts';
import locationReducer from '../features/location/state/locationSlice.ts';
import inventoriesReducer from '../features/inventory/state/inventorySlice.ts';
import warehouseReducer from '../features/warehouse/state/warehouseSlice.ts';
import warehouseInventorySummaryReducer from '../features/warehouse-inventory/state/warehouseInventorySummarySlice.ts';
import warehouseInventoriesReducer from '../features/warehouse-inventory/state/warehouseInventorySlice.ts';
import warehouseProductsReducer from '../features/warehouse-inventory/state/warehouseProductSlice.ts';
import warehouseInventroyDetailsReducer from '../features/warehouse-inventory/state/warehouseInventoryDetailSlice.ts';

// Combine reducers
const appReducer = combineReducers({
  health: healthReducer,
  csrf: csrfReducer,
  session: sessionReducer,
  userProfile: userProfileReducer,
  resetPassword: resetPasswordReducer,
  users: usersReducer,
  permissions: permissionsReducer,
  products: productsReducer,
  product: productReducer,
  pricingTypes: pricingTypesReducer,
  pricingType: pricingTypeReducer,
  pricings: pricingsReducer,
  pricing: pricingReducer,
  locationTypes: locationTypesReducer,
  locationType: locationTypeReducer,
  locations: locationReducer,
  inventories: inventoriesReducer,
  warehouses: warehouseReducer,
  warehouseInventoriesSummary: warehouseInventorySummaryReducer,
  warehouseInventories: warehouseInventoriesReducer,
  warehouseProducts: warehouseProductsReducer,
  warehouseInventoryDetails: warehouseInventroyDetailsReducer,
});

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
