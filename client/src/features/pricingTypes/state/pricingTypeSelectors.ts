import { RootState } from '../../../store/store';

export const selectPricingTypes = (state: RootState) => state.pricingTypes.data;
export const selectTotalRecords = (state: RootState) => state.pricingTypes.totalRecords;
export const selectTotalPages = (state: RootState) => state.pricingTypes.totalPages;
export const selectIsLoading = (state: RootState) => state.pricingTypes.isLoading;
export const selectError = (state: RootState) => state.pricingTypes.error;
