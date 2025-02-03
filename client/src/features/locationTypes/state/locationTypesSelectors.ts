import { RootState } from '../../../store/store.ts';
import { LocationType, Pagination } from './locationTypeTypes.ts';

/**
 * Selects the entire location types state.
 */
export const selectLocationTypesState = (state: RootState) => state.locationTypes;

/**
 * Selects the list of location types.
 */
export const selectLocationTypes = (state: RootState): LocationType[] => state.locationTypes.data;

/**
 * Selects pagination details.
 */
export const selectLocationTypesPagination = (state: RootState): Pagination => state.locationTypes.pagination;

/**
 * Selects loading state.
 */
export const selectLocationTypesLoading = (state: RootState): boolean => state.locationTypes.loading;

/**
 * Selects error message.
 */
export const selectLocationTypesError = (state: RootState): string | null => state.locationTypes.error;
