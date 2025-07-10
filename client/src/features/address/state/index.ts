import addressCreationReducer from './addressCreationSlice';
import paginatedAddressReducer from './paginateAddressSlice';
import addressByCustomerReducer from './addressByCustomerSlice';

export const addressReducers = {
  addressCreation: addressCreationReducer,
  paginatedAddress: paginatedAddressReducer,
  addressByCustomer: addressByCustomerReducer,
};

export * from './addressCreationSelectors';
export * from './paginateAddressSelectors';
export * from './addressByCustomerSelectors';
export * from './addressThunks';
export * from './addressTypes';
