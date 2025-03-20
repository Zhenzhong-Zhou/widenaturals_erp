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
import compliancesReducer from '../features/compliance/state/complianceSlice.ts';
import pricingTypesReducer from '../features/pricingType/state/pricingTypeSlice.ts';
import pricingTypeReducer from '../features/pricingType/state/pricingTypeDetailSlice.ts';
import pricingsReducer from '../features/pricing/state/pricingSlice.ts';
import pricingReducer from '../features/pricing/state/pricingDetailSlice.ts';
import locationTypesReducer from '../features/locationType/state/locationTypesSlice.ts';
import locationTypeReducer from '../features/locationType/state/locationTypeDetailSlice.ts';
import locationReducer from '../features/location/state/locationSlice.ts';
import inventoriesReducer from '../features/inventory/state/inventorySlice.ts';
import warehouseReducer from '../features/warehouse/state/warehouseSlice.ts';
import warehouseDetailsReducer from '../features/warehouse/state/warehouseDetailSlice.ts';
import warehouseInventorySummaryReducer from '../features/warehouse-inventory/state/warehouseInventorySummarySlice.ts';
import warehouseInventoriesReducer from '../features/warehouse-inventory/state/warehouseInventorySlice.ts';
import warehouseProductsReducer from '../features/warehouse-inventory/state/warehouseProductSlice.ts';
import warehouseInventoryDetailsReducer from '../features/warehouse-inventory/state/warehouseInventoryDetailSlice.ts';
import lotAdjustmentDropdownReducer from '../features/warehouse-inventory/state/lotAdjustmentDropdownSlice.ts';
import lotAdjustmentQtyReducer from '../features/warehouse-inventory/state/lotAdjustmentQtySlice.ts';
import inventoryDropdownReducer from '../features/warehouse-inventory/state/inventoryDropdownSlice.ts';
import bulkInsertWarehouseInventoryReducer from '../features/warehouse-inventory/state/bulkInsertWarehouseInventorySlice.ts';
import insertedInventoryRecordsResponseReducer from '../features/warehouse-inventory/state/insertedInventoryRecordsResponseSlice.ts';
import adjustmentReportReducer from '../features/report/state/adjustmentReportSlice.ts';
import inventoryActivityLogsReducer from '../features/report/state/inventoryActivityLogsSlice.ts';
import inventoryHistoryReducer from '../features/report/state/inventoryHistorySlice.ts';
import orderTypesReducer from '../features/orderType/state/orderTypeSlice.ts';
import orderTypesDropDownReducer from '../features/order/state/orderTypeDropdownSlice.ts';
import customersCreateReducer from '../features/customer/state/customerCreateSlice.ts';
import customersReducer from '../features/customer/state/customerSlice.ts';
import customerDetailReducer from '../features/customer/state/customerDetailSlice.ts';
import createSalesOrderReducer from '../features/order/state/createSalesOrderSlice.ts';
import customerDropdownReducer from '../features/customer/state/customerDropdownSlice.ts';
import discountDropdownReducer from '../features/discount/state/discountDropdownSlice';
import taxRateDropdownReducer from '../features/taxRate/state/taxRateDropdownSlice.ts';
import deliveryMethodDropdownReducer from '../features/deliveryMethod/state/deliveryMethodDropdownSlice.ts';
import productOrderDropdownReducer from '../features/product/state/productOrderDropdownSlice.ts';

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
  compliances: compliancesReducer,
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
  warehouseDetails: warehouseDetailsReducer,
  warehouseInventoriesSummary: warehouseInventorySummaryReducer,
  warehouseInventories: warehouseInventoriesReducer,
  warehouseProducts: warehouseProductsReducer,
  warehouseInventoryDetails: warehouseInventoryDetailsReducer,
  lotAdjustmentsDropdown: lotAdjustmentDropdownReducer,
  lotAdjustmentQty: lotAdjustmentQtyReducer,
  inventoryDropdown: inventoryDropdownReducer,
  bulkInsertWarehouseInventory: bulkInsertWarehouseInventoryReducer,
  insertedInventoryRecordsResponse: insertedInventoryRecordsResponseReducer,
  adjustmentReport: adjustmentReportReducer,
  inventoryActivityLogs: inventoryActivityLogsReducer,
  inventoryHistory: inventoryHistoryReducer,
  orderTypes: orderTypesReducer,
  orderTypesDropdown: orderTypesDropDownReducer,
  customersCreate: customersCreateReducer,
  customers: customersReducer,
  customerDetail: customerDetailReducer,
  createSalesOrder: createSalesOrderReducer,
  customerDropdown: customerDropdownReducer,
  discountDropdown: discountDropdownReducer,
  taxRateDropdown: taxRateDropdownReducer,
  deliveryMethodDropdown: deliveryMethodDropdownReducer,
  productOrderDropdown: productOrderDropdownReducer,
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
