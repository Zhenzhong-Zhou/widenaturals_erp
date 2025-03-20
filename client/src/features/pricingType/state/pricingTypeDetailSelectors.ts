import { RootState } from '../../../store/store';

// Selects the single Pricing Type details object
export const selectPricingTypeDetails = (state: RootState) =>
  state.pricingType.pricingTypeDetails;

// Selects the array of Pricing Records (list of product prices)
export const selectPricingRecords = (state: RootState) =>
  state.pricingType.pricingDetails;

// Selects pagination info
export const selectPricingPagination = (state: RootState) =>
  state.pricingType.pagination;

// Selects the loading state
export const selectPricingIsLoading = (state: RootState) =>
  state.pricingType.isLoading;

// Selects any error messages
export const selectPricingError = (state: RootState) => state.pricingType.error;
