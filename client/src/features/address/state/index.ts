import addressCreationReducer from './addressCreationSlice';
import paginatedAddressReducer from './paginateAddressSlice';

export const addressReducers = {
  addressCreation: addressCreationReducer,
  paginatedAddress: paginatedAddressReducer,
};

export * from './addressCreationSelectors';
export * from './addressThunks';
export * from './addressTypes';
