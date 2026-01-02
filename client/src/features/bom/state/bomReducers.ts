import paginatedBomsReducer from './paginatedBomsSlice';
import bomDetailsReducer from './bomDetailsSlice';
import bomMaterialSupplyDetailsReducer from './bomMaterialSupplyDetailsSlice';
import bomProductionReadinessReducer from './bomProductionReadinessSlice';

/**
 * Reducer map for the BOM (Bill of Materials) feature.
 *
 * This object is consumed exclusively by the root reducer to compose
 * the `bom` state subtree.
 *
 * Design notes:
 * - Slice reducers are imported locally to avoid circular ESM
 *   initialization (TDZ) issues.
 * - This file must not import from feature or state index files.
 * - Reducer slices are private implementation details; only this
 *   reducer group is exposed publicly.
 */
export const bomReducers = {
  /** Paginated BOM list, filters, and pagination metadata */
  paginatedBoms: paginatedBomsReducer,

  /** Single BOM details, including header and related entities */
  bomDetails: bomDetailsReducer,

  /** Material supply and availability information for a BOM */
  bomMaterialSupplyDetails: bomMaterialSupplyDetailsReducer,

  /** Production readiness and validation status for a BOM */
  bomProductionReadiness: bomProductionReadinessReducer,
};
