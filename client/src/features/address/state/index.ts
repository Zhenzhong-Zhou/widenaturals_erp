import addressCreationReducer from './addressCreationSlice';
import paginatedAddressReducer from './paginateAddressSlice';

export const addressReducers = {
  addressCreation: addressCreationReducer,
  paginatedAddress: paginatedAddressReducer,
};

export * from './addressCreationSelectors';
export * from './paginateAddressSelectors';
export * from './addressThunks';
export * from './addressTypes';
